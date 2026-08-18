import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UserRole,
  IncidentStatus,
  AlertType,
  AlertSeverity,
  ServiceStatus,
} from '@prisma/client';

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    tenantId: string | null,
    userRole: UserRole,
    limit = 50,
    skip = 0,
    status?: IncidentStatus,
    serviceId?: string,
  ) {
    const whereClause: {
      status?: IncidentStatus;
      serviceId?: string;
      service?: {
        tenantId?: string | null;
        userId?: string;
      };
    } = {};

    if (status) {
      whereClause.status = status;
    }
    if (serviceId) {
      whereClause.serviceId = serviceId;
    }

    // Super Admin sees everything. Regular roles see only tenant-scoped incidents.
    if (userRole !== UserRole.SUPER_ADMIN) {
      if (tenantId) {
        whereClause.service = {
          tenantId,
        };
      } else {
        whereClause.service = {
          userId, // fallback if user has no tenant
        };
      }
    }

    return this.prisma.incident.findMany({
      where: whereClause,
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip,
      include: { service: true },
    });
  }

  async findOne(userId: string, tenantId: string | null, userRole: UserRole, id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }

    // Bypass check for Platform Super Admins
    if (userRole === UserRole.SUPER_ADMIN) {
      return incident;
    }

    // Validate tenant isolation
    const isOwner = tenantId
      ? incident.service.tenantId === tenantId
      : incident.service.userId === userId;

    if (!isOwner) {
      throw new ForbiddenException(
        'You do not have permission to access this incident',
      );
    }

    return incident;
  }

  async acknowledge(userId: string, tenantId: string | null, userRole: UserRole, id: string) {
    const incident = await this.findOne(userId, tenantId, userRole, id);

    if (incident.status === IncidentStatus.RESOLVED) {
      throw new ForbiddenException('Cannot acknowledge a resolved incident');
    }

    return this.prisma.incident.update({
      where: { id },
      data: {
        status: IncidentStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
      },
    });
  }

  async resolve(userId: string, tenantId: string | null, userRole: UserRole, id: string) {
    const incident = await this.findOne(userId, tenantId, userRole, id);

    if (incident.status === IncidentStatus.RESOLVED) {
      throw new ForbiddenException('Incident is already resolved');
    }

    const resolvedIncident = await this.prisma.incident.update({
      where: { id },
      data: {
        status: IncidentStatus.RESOLVED,
        resolvedAt: new Date(),
      },
    });

    // Create a manual resolution alert
    await this.prisma.alert.create({
      data: {
        serviceId: incident.serviceId,
        incidentId: incident.id,
        type: AlertType.INCIDENT_RESOLVED,
        title: 'Incident Manually Resolved',
        message: `Downtime incident #${incident.id} has been manually resolved by an operator.`,
        severity: AlertSeverity.INFO,
      },
    });

    // Also write a SERVICE_RECOVERED alert
    await this.prisma.alert.create({
      data: {
        serviceId: incident.serviceId,
        incidentId: incident.id,
        type: AlertType.SERVICE_RECOVERED,
        title: 'Service Restored',
        message: `Service "${incident.service.name}" has been marked as recovered via manual resolution.`,
        severity: AlertSeverity.INFO,
      },
    });

    // Reset service status to HEALTHY
    await this.prisma.service.update({
      where: { id: incident.serviceId },
      data: {
        status: ServiceStatus.HEALTHY,
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
      },
    });

    return resolvedIncident;
  }
}
