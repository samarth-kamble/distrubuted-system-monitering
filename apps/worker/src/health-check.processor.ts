import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { CheckStatus, ServiceStatus } from '@prisma/client';
import { MONITOR_THRESHOLDS } from '@pulseguard/shared';
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

  private determineNextStatus(
    currentStatus: ServiceStatus,
    isSuccess: boolean,
    latencyMs: number,
    nextSuccesses: number,
    nextFailures: number,
    failureThreshold: number,
    recoveryThreshold: number,
  ): ServiceStatus {
    const isSlow =
      latencyMs >= MONITOR_THRESHOLDS.DEGRADED_LATENCY_THRESHOLD_MS;

    if (isSuccess) {
      if (currentStatus === ServiceStatus.UNKNOWN) {
        return isSlow ? ServiceStatus.DEGRADED : ServiceStatus.HEALTHY;
      }
      if (
        currentStatus === ServiceStatus.DOWN ||
        currentStatus === ServiceStatus.RECOVERING ||
        currentStatus === ServiceStatus.DEGRADED
      ) {
        if (nextSuccesses >= recoveryThreshold) {
          return isSlow ? ServiceStatus.DEGRADED : ServiceStatus.HEALTHY;
        }
        return currentStatus === ServiceStatus.DOWN
          ? ServiceStatus.RECOVERING
          : currentStatus;
      }

      // If current is HEALTHY, transition to DEGRADED if it is slow
      if (currentStatus === ServiceStatus.HEALTHY && isSlow) {
        return ServiceStatus.DEGRADED;
      }

      return ServiceStatus.HEALTHY;
    } else {
      // Failure
      if (nextFailures >= failureThreshold) {
        return ServiceStatus.DOWN;
      }
      if (
        currentStatus === ServiceStatus.HEALTHY ||
        currentStatus === ServiceStatus.DEGRADED
      ) {
        // If failures < threshold, a healthy service goes to DEGRADED.
        // A degraded service stays DEGRADED.
        return ServiceStatus.DEGRADED;
      }
      if (currentStatus === ServiceStatus.RECOVERING) {
        // 1 Failure in RECOVERING trips it back to DOWN
        return ServiceStatus.DOWN;
      }
      return currentStatus;
    }
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
      let attempt = 1;
      const maxAttempts = service.retryCount + 1;
      let finalStatus: CheckStatus = CheckStatus.FAILURE;
      let finalLatencyMs = 0;

      while (attempt <= maxAttempts) {
        if (attempt > 1) {
          this.logger.log(
            `[Processor] [Retry] Retrying service "${service.name}" (attempt ${attempt}/${maxAttempts})...`,
          );
        }

        const result = await this.httpProber.probe(
          service.targetUrl,
          service.method,
          service.timeoutMs,
        );

        finalStatus = result.status;
        finalLatencyMs = result.responseTimeMs ?? 0;

        this.logger.log(
          `[Processor] Checked service "${service.name}" (attempt ${attempt}). Status: ${result.status}, Latency: ${result.responseTimeMs ?? 0}ms`,
        );

        // Save check results in the database for this specific attempt
        await this.prisma.serviceCheck.create({
          data: {
            serviceId: service.id,
            status: result.status,
            responseCode: result.responseCode,
            responseTimeMs: result.responseTimeMs,
            errorMessage: result.errorMessage,
            attemptNumber: attempt,
          },
        });

        if (result.status === CheckStatus.SUCCESS) {
          break;
        }

        attempt++;
        if (attempt <= maxAttempts) {
          const delayMs = Math.pow(2, attempt - 2) * 1000;
          this.logger.log(
            `[Processor] [Retry] Waiting ${delayMs / 1000}s before attempt ${attempt}...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      const isSuccess = finalStatus === CheckStatus.SUCCESS;

      const nextSuccesses = isSuccess ? service.consecutiveSuccesses + 1 : 0;
      const nextFailures = isSuccess ? 0 : service.consecutiveFailures + 1;

      const nextStatus = this.determineNextStatus(
        service.status,
        isSuccess,
        finalLatencyMs,
        nextSuccesses,
        nextFailures,
        service.failureThreshold,
        service.recoveryThreshold,
      );

      if (nextStatus !== service.status) {
        this.logger.log(
          `[Processor] Status transition for service "${service.name}": ${service.status} -> ${nextStatus}`,
        );
      }

      // Update service heartbeat timestamp, counters, and status
      await this.prisma.service.update({
        where: { id: service.id },
        data: {
          lastCheckedAt: new Date(),
          consecutiveSuccesses: nextSuccesses,
          consecutiveFailures: nextFailures,
          status: nextStatus,
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
