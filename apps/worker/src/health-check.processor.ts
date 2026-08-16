import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  CheckStatus,
  ServiceStatus,
  IncidentStatus,
  IncidentSeverity,
  Service,
  AlertType,
  AlertSeverity,
} from '@prisma/client';
import { MONITOR_THRESHOLDS } from '@pulseguard/shared';
import { PrismaService } from './prisma/prisma.service';
import { HttpProberService } from './prober/http-prober.service';
import { RedisLockService } from './prober/lock.service';
import {
  CircuitBreakerService,
  CircuitState,
} from './prober/circuit-breaker.service';

@Processor('health-check')
@Injectable()
export class HealthCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(HealthCheckProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpProber: HttpProberService,
    private readonly lockService: RedisLockService,
    private readonly circuitBreakerService: CircuitBreakerService,
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

      if (currentStatus === ServiceStatus.HEALTHY && isSlow) {
        return ServiceStatus.DEGRADED;
      }

      return ServiceStatus.HEALTHY;
    } else {
      if (nextFailures >= failureThreshold) {
        return ServiceStatus.DOWN;
      }
      if (
        currentStatus === ServiceStatus.HEALTHY ||
        currentStatus === ServiceStatus.DEGRADED
      ) {
        return ServiceStatus.DEGRADED;
      }
      if (currentStatus === ServiceStatus.RECOVERING) {
        return ServiceStatus.DOWN;
      }
      return currentStatus;
    }
  }

  private async ensureIncidentCreated(
    service: Service,
    finalStatus: CheckStatus,
    finalResponseCode: number | null,
    finalErrorMessage: string | null,
  ): Promise<void> {
    const existingIncident = await this.prisma.incident.findFirst({
      where: {
        serviceId: service.id,
        status: { in: [IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED] },
      },
    });

    if (!existingIncident) {
      let severity: IncidentSeverity = IncidentSeverity.CRITICAL;
      if (finalStatus === CheckStatus.TIMEOUT) {
        severity = IncidentSeverity.HIGH;
      } else if (finalStatus === CheckStatus.ERROR) {
        severity = IncidentSeverity.MEDIUM;
      }

      let reason = finalErrorMessage || 'Unknown health check failure';
      if (finalResponseCode) {
        reason = `HTTP ${finalResponseCode}: ${reason}`;
      } else if (finalStatus === CheckStatus.TIMEOUT) {
        reason = 'Request Timeout';
      } else if (finalStatus === CheckStatus.ERROR) {
        reason = 'Internal worker error during health check';
      }

      this.logger.log(
        `[Processor] Creating Incident for service "${service.name}" (${service.id}) -> Severity: ${severity}, Reason: ${reason}`,
      );

      const newIncident = await this.prisma.incident.create({
        data: {
          serviceId: service.id,
          severity,
          reason,
          status: IncidentStatus.OPEN,
          startedAt: new Date(),
        },
      });

      // Create an alert for incident creation
      await this.prisma.alert.create({
        data: {
          serviceId: service.id,
          incidentId: newIncident.id,
          type: AlertType.INCIDENT_CREATED,
          title: 'Incident Created',
          message: `Downtime incident #${newIncident.id} has been opened for service "${service.name}".`,
          severity: AlertSeverity.CRITICAL,
        },
      });

      // Also create a SERVICE_DOWN alert
      await this.prisma.alert.create({
        data: {
          serviceId: service.id,
          incidentId: newIncident.id,
          type: AlertType.SERVICE_DOWN,
          title: 'Service Down',
          message: `Service "${service.name}" is DOWN: ${reason}`,
          severity: AlertSeverity.CRITICAL,
        },
      });
    }
  }

  private async ensureIncidentResolved(service: Service): Promise<void> {
    const activeIncident = await this.prisma.incident.findFirst({
      where: {
        serviceId: service.id,
        status: { in: [IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED] },
      },
    });

    if (activeIncident) {
      this.logger.log(
        `[Processor] Service "${service.name}" recovered. Resolving Incident #${activeIncident.id}.`,
      );

      await this.prisma.incident.update({
        where: { id: activeIncident.id },
        data: {
          status: IncidentStatus.RESOLVED,
          resolvedAt: new Date(),
        },
      });

      // Create a SERVICE_RECOVERED alert
      await this.prisma.alert.create({
        data: {
          serviceId: service.id,
          incidentId: activeIncident.id,
          type: AlertType.SERVICE_RECOVERED,
          title: 'Service Recovered',
          message: `Service "${service.name}" has recovered successfully after hitting the recovery threshold.`,
          severity: AlertSeverity.INFO,
        },
      });

      // Create an INCIDENT_RESOLVED alert
      await this.prisma.alert.create({
        data: {
          serviceId: service.id,
          incidentId: activeIncident.id,
          type: AlertType.INCIDENT_RESOLVED,
          title: 'Incident Resolved',
          message: `Downtime incident #${activeIncident.id} has been automatically resolved.`,
          severity: AlertSeverity.INFO,
        },
      });
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

    // Check circuit breaker status
    const circuitState = await this.circuitBreakerService.getState(serviceId);
    if (circuitState === CircuitState.OPEN) {
      this.logger.warn(
        `[Processor] Circuit breaker is OPEN for service "${service.name}" (${serviceId}). Short-circuiting health check.`,
      );

      // Save a failed check record representing the short-circuit
      await this.prisma.serviceCheck.create({
        data: {
          serviceId: service.id,
          status: CheckStatus.FAILURE,
          responseTimeMs: 0,
          errorMessage: 'Short-circuited: Circuit breaker is OPEN',
          attemptNumber: 1,
        },
      });

      const nextFailures = service.consecutiveFailures + 1;
      const nextStatus = this.determineNextStatus(
        service.status,
        false, // isSuccess = false
        0, // latency = 0
        0, // nextSuccesses = 0
        nextFailures,
        service.failureThreshold,
        service.recoveryThreshold,
      );

      if (
        nextStatus === ServiceStatus.DOWN &&
        service.status !== ServiceStatus.DOWN
      ) {
        await this.ensureIncidentCreated(
          service,
          CheckStatus.FAILURE,
          null,
          'Short-circuited: Circuit breaker is OPEN',
        );
      }

      // Update service status and increment failure counter
      await this.prisma.service.update({
        where: { id: service.id },
        data: {
          lastCheckedAt: new Date(),
          consecutiveSuccesses: 0,
          consecutiveFailures: nextFailures,
          status: nextStatus,
        },
      });

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
      `[Processor] [Heartbeat] Checking service "${service.name}" -> ${service.method} ${service.targetUrl} (Circuit: ${circuitState})`,
    );

    try {
      let attempt = 1;
      // In HALF_OPEN state, we only allow a single probe request (no retries) to test the server
      const maxAttempts =
        circuitState === CircuitState.HALF_OPEN ? 1 : service.retryCount + 1;
      let finalStatus: CheckStatus = CheckStatus.FAILURE;
      let finalLatencyMs = 0;
      let finalResponseCode: number | null = null;
      let finalErrorMessage: string | null = null;

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
        finalResponseCode = result.responseCode ?? null;
        finalErrorMessage = result.errorMessage ?? null;

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

      if (
        nextStatus === ServiceStatus.DOWN &&
        service.status !== ServiceStatus.DOWN
      ) {
        await this.ensureIncidentCreated(
          service,
          finalStatus,
          finalResponseCode,
          finalErrorMessage,
        );
      }

      const recovered =
        (nextStatus === ServiceStatus.HEALTHY ||
          nextStatus === ServiceStatus.DEGRADED) &&
        (service.status === ServiceStatus.DOWN ||
          service.status === ServiceStatus.RECOVERING);

      if (recovered) {
        await this.ensureIncidentResolved(service);
      }

      if (
        nextStatus === ServiceStatus.DEGRADED &&
        service.status !== ServiceStatus.DEGRADED
      ) {
        await this.prisma.alert.create({
          data: {
            serviceId: service.id,
            type: AlertType.SERVICE_DEGRADED,
            title: 'Service Degraded',
            message: `Service "${service.name}" is performing abnormally slow (latency: ${finalLatencyMs}ms) or has minor consecutive failures.`,
            severity: AlertSeverity.MEDIUM,
          },
        });
      }

      if (
        nextStatus === ServiceStatus.HEALTHY &&
        service.status === ServiceStatus.DEGRADED
      ) {
        await this.prisma.alert.create({
          data: {
            serviceId: service.id,
            type: AlertType.SERVICE_RECOVERED,
            title: 'Service Restored',
            message: `Service "${service.name}" latency has returned to normal (${finalLatencyMs}ms).`,
            severity: AlertSeverity.INFO,
          },
        });
      }

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

      // Handle Circuit Breaker State Transitions
      if (isSuccess) {
        if (circuitState === CircuitState.HALF_OPEN) {
          this.logger.log(
            `[Processor] [CircuitBreaker] Service "${service.name}" succeeded in HALF_OPEN. Closing circuit.`,
          );
          await this.circuitBreakerService.transitionTo(
            service.id,
            CircuitState.CLOSED,
          );
        }
      } else {
        if (circuitState === CircuitState.HALF_OPEN) {
          this.logger.warn(
            `[Processor] [CircuitBreaker] Service "${service.name}" failed in HALF_OPEN. Re-opening circuit.`,
          );
          await this.circuitBreakerService.transitionTo(
            service.id,
            CircuitState.OPEN,
          );
        } else if (
          circuitState === CircuitState.CLOSED &&
          nextFailures >= service.failureThreshold
        ) {
          this.logger.warn(
            `[Processor] [CircuitBreaker] Service "${service.name}" failed consecutive checks >= threshold (${service.failureThreshold}). Tripping circuit to OPEN.`,
          );
          await this.circuitBreakerService.transitionTo(
            service.id,
            CircuitState.OPEN,
          );
        }
      }
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
