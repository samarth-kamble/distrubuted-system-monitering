import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async findAll(userId: string, userRole: UserRole) {
    if (userRole === UserRole.ADMIN || userRole === UserRole.OPERATOR) {
      return this.prisma.service.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.service.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, userRole: UserRole, id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.OPERATOR &&
      service.userId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to access this service',
      );
    }

    return service;
  }

  async update(
    userId: string,
    userRole: UserRole,
    id: string,
    dto: UpdateServiceDto,
  ) {
    await this.findOne(userId, userRole, id);

    return this.prisma.service.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, userRole: UserRole, id: string) {
    await this.findOne(userId, userRole, id);

    return this.prisma.service.delete({
      where: { id },
    });
  }

  async enable(userId: string, userRole: UserRole, id: string) {
    await this.findOne(userId, userRole, id);

    return this.prisma.service.update({
      where: { id },
      data: { enabled: true },
    });
  }

  async disable(userId: string, userRole: UserRole, id: string) {
    await this.findOne(userId, userRole, id);

    return this.prisma.service.update({
      where: { id },
      data: { enabled: false },
    });
  }

  async findChecks(
    userId: string,
    userRole: UserRole,
    id: string,
    limit = 50,
    skip = 0,
  ) {
    await this.findOne(userId, userRole, id);

    return this.prisma.serviceCheck.findMany({
      where: { serviceId: id },
      orderBy: { checkedAt: 'desc' },
      take: limit,
      skip,
    });
  }

  async getMetrics(userId: string, userRole: UserRole, id: string) {
    const service = await this.findOne(userId, userRole, id);

    // 1. Success/Failure counts
    const totalChecks = await this.prisma.serviceCheck.count({
      where: { serviceId: id },
    });

    const successfulChecks = await this.prisma.serviceCheck.count({
      where: { serviceId: id, status: 'SUCCESS' },
    });

    const failedChecks = totalChecks - successfulChecks;
    const availabilityPercentage =
      totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100.0;
    const errorRate =
      totalChecks > 0 ? (failedChecks / totalChecks) * 100 : 0.0;

    // 2. Latency percentiles calculation
    const allChecksWithLatency = await this.prisma.serviceCheck.findMany({
      where: {
        serviceId: id,
        responseTimeMs: { not: null },
      },
      select: { responseTimeMs: true },
    });

    const latencies = allChecksWithLatency
      .map((c) => c.responseTimeMs)
      .filter((val): val is number => val !== null);

    const sum = latencies.reduce((acc, curr) => acc + curr, 0);
    const latencyAvg = latencies.length > 0 ? sum / latencies.length : 0;

    const sorted = [...latencies].sort((a, b) => a - b);
    const getPercentile = (pct: number) => {
      if (sorted.length === 0) return 0;
      const index = Math.ceil((pct / 100) * sorted.length) - 1;
      return sorted[Math.max(0, index)];
    };

    const p50 = getPercentile(50);
    const p95 = getPercentile(95);
    const p99 = getPercentile(99);

    // 3. Downtime calculations based on Incidents
    const serviceIncidents = await this.prisma.incident.findMany({
      where: { serviceId: id },
    });

    let downtimeDurationSeconds = 0;
    let activeIncidents = 0;
    const now = new Date();

    for (const incident of serviceIncidents) {
      if (incident.status === 'RESOLVED') {
        if (incident.resolvedAt) {
          const diffMs =
            incident.resolvedAt.getTime() - incident.startedAt.getTime();
          downtimeDurationSeconds += Math.max(0, Math.floor(diffMs / 1000));
        }
      } else {
        activeIncidents++;
        const diffMs = now.getTime() - incident.startedAt.getTime();
        downtimeDurationSeconds += Math.max(0, Math.floor(diffMs / 1000));
      }
    }

    const totalMonitoredMs = now.getTime() - service.createdAt.getTime();
    const totalMonitoredSeconds = Math.max(
      1,
      Math.floor(totalMonitoredMs / 1000),
    );

    const uptimePercentage = Math.max(
      0.0,
      Math.min(
        100.0,
        ((totalMonitoredSeconds - downtimeDurationSeconds) /
          totalMonitoredSeconds) *
          100,
      ),
    );

    return {
      uptimePercentage,
      availabilityPercentage,
      totalChecks,
      successfulChecks,
      failedChecks,
      errorRate,
      latency: {
        avg: latencyAvg,
        p50,
        p95,
        p99,
      },
      downtimeDurationSeconds,
      activeIncidents,
    };
  }
}
