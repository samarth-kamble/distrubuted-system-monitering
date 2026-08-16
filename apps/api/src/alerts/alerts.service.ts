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
        userId: string;
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

    // Role check: Viewers can only see alerts of services they own
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.OPERATOR) {
      whereClause.service = {
        userId,
      };
    }

    return this.prisma.alert.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      include: { service: true, incident: true },
    });
  }

  async findOne(userId: string, userRole: UserRole, id: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: { service: true, incident: true },
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.OPERATOR &&
      alert.service.userId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to access this alert',
      );
    }

    return alert;
  }
}
