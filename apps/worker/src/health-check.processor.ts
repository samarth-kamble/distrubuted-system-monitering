import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from './prisma/prisma.service';
import { HttpProberService } from './prober/http-prober.service';
import { RedisLockService } from './prober/lock.service';

@Processor('health-check')
@Injectable()
export class HealthCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(HealthCheckProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpProber: HttpProberService,
    private readonly lockService: RedisLockService,
  ) {
    super();
  }

  async process(job: Job<{ serviceId: string }>): Promise<void> {
    const { serviceId } = job.data;
    this.logger.log(
      `[Processor] Received health check job for service ID: ${serviceId}`,
    );

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      this.logger.warn(
        `[Processor] Service ${serviceId} not found in database. Skipping.`,
      );
      return;
    }

    if (!service.enabled) {
      this.logger.warn(
        `[Processor] Service "${service.name}" (${serviceId}) is disabled. Skipping check.`,
      );
      return;
    }

    const lockKey = `lock:service:${serviceId}`;
    const lockValue = crypto.randomUUID();
    const lockTtlMs = service.timeoutMs * 2;

    const acquired = await this.lockService.acquireLock(
      lockKey,
      lockValue,
      lockTtlMs,
    );

    if (!acquired) {
      this.logger.warn(
        `[Processor] Service "${service.name}" (${serviceId}) is currently being checked by another worker. Skipping check.`,
      );
      return;
    }

    this.logger.log(
      `[Processor] [Heartbeat] Checking service "${service.name}" -> ${service.method} ${service.targetUrl}`,
    );

    try {
      const result = await this.httpProber.probe(
        service.targetUrl,
        service.method,
        service.timeoutMs,
      );

      this.logger.log(
        `[Processor] Checked service "${service.name}". Status: ${result.status}, Latency: ${result.responseTimeMs ?? 0}ms`,
      );

      // Save check results in the database
      await this.prisma.serviceCheck.create({
        data: {
          serviceId: service.id,
          status: result.status,
          responseCode: result.responseCode,
          responseTimeMs: result.responseTimeMs,
          errorMessage: result.errorMessage,
          attemptNumber: 1,
        },
      });

      // Update service heartbeat timestamp
      await this.prisma.service.update({
        where: { id: service.id },
        data: {
          lastCheckedAt: new Date(),
        },
      });
    } catch (error: any) {
      this.logger.error(
        `[Processor] Failed to execute probe for service "${service.name}":`,
        error,
      );
    } finally {
      await this.lockService.releaseLock(lockKey, lockValue);
    }
  }
}
