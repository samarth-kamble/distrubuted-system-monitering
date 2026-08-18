import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, AlertSeverity, AlertType } from '@prisma/client';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    tenantId: string | null,
    userRole: UserRole,
    limit = 50,
    skip = 0,
    severity?: AlertSeverity,
    serviceId?: string,
    type?: AlertType,
  ) {
    const whereClause: {
      severity?: AlertSeverity;
      serviceId?: string;
      type?: AlertType;
      service?: {
        tenantId?: string | null;
        userId?: string;
      };
    } = {};

    if (severity) {
      whereClause.severity = severity;
    }
    if (serviceId) {
      whereClause.serviceId = serviceId;
    }
    if (type) {
      whereClause.type = type;
    }

    // Super Admin sees everything. Regular roles see only tenant-scoped alerts.
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

    return this.prisma.alert.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      include: { service: true, incident: true },
    });
  }

  async findOne(userId: string, tenantId: string | null, userRole: UserRole, id: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: { service: true, incident: true },
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    // Bypass check for Platform Super Admins
    if (userRole === UserRole.SUPER_ADMIN) {
      return alert;
    }

    // Validate tenant isolation
    const isOwner = tenantId
      ? alert.service.tenantId === tenantId
      : alert.service.userId === userId;

    if (!isOwner) {
      throw new ForbiddenException(
        'You do not have permission to access this alert',
      );
    }

    return alert;
  }
}
