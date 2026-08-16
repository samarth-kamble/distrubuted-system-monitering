import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, IncidentStatus } from '@prisma/client';

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, userRole: UserRole) {
    if (userRole === UserRole.ADMIN || userRole === UserRole.OPERATOR) {
      return this.prisma.incident.findMany({
        orderBy: { startedAt: 'desc' },
        include: { service: true },
      });
    }

    return this.prisma.incident.findMany({
      where: {
        service: {
          userId,
        },
      },
      orderBy: { startedAt: 'desc' },
      include: { service: true },
    });
  }

  async findOne(userId: string, userRole: UserRole, id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }

    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.OPERATOR &&
      incident.service.userId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to access this incident',
      );
    }

    return incident;
  }

  async acknowledge(userId: string, userRole: UserRole, id: string) {
    const incident = await this.findOne(userId, userRole, id);

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
}
