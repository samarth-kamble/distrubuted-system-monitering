import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Registry, Gauge } from 'prom-client';
import {
  ServiceStatus,
  CheckStatus,
  IncidentStatus,
  UserRole,
} from '@prisma/client';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;

  // Global gauges
  private readonly totalServicesGauge: Gauge<string>;
  private readonly serviceStatusGauge: Gauge<string>;
  private readonly activeIncidentsGauge: Gauge<string>;

  // Per-service gauges
  private readonly serviceAvailabilityGauge: Gauge<string>;
  private readonly serviceTotalRequestsGauge: Gauge<string>;
  private readonly serviceSuccessCountGauge: Gauge<string>;
  private readonly serviceFailureCountGauge: Gauge<string>;
  private readonly serviceLatencyGauge: Gauge<string>;

  constructor(private readonly prisma: PrismaService) {
    this.registry = new Registry();

    // Configure Prometheus Gauges
    this.totalServicesGauge = new Gauge({
      name: 'pulseguard_global_services_monitored_total',
      help: 'Total count of service monitors configured in the system',
      registers: [this.registry],
    });

    this.serviceStatusGauge = new Gauge({
      name: 'pulseguard_global_service_status_count',
      help: 'Breakdown of service monitors count by status (HEALTHY, DEGRADED, DOWN, RECOVERING, UNKNOWN)',
      labelNames: ['status'],
      registers: [this.registry],
    });

    this.activeIncidentsGauge = new Gauge({
      name: 'pulseguard_global_active_incidents_total',
      help: 'Total count of currently active (OPEN or ACKNOWLEDGED) incidents',
      registers: [this.registry],
    });

    this.serviceAvailabilityGauge = new Gauge({
      name: 'pulseguard_service_availability_ratio',
      help: 'Uptime availability ratio (success_checks / total_checks) of the service monitor',
      labelNames: ['service_id', 'service_name', 'target_url'],
      registers: [this.registry],
    });

    this.serviceTotalRequestsGauge = new Gauge({
      name: 'pulseguard_service_checks_total',
      help: 'Total number of health checks executed for the service monitor',
      labelNames: ['service_id', 'service_name', 'target_url'],
      registers: [this.registry],
    });

    this.serviceSuccessCountGauge = new Gauge({
      name: 'pulseguard_service_checks_success_total',
      help: 'Total number of successful health checks executed for the service monitor',
      labelNames: ['service_id', 'service_name', 'target_url'],
      registers: [this.registry],
    });

    this.serviceFailureCountGauge = new Gauge({
      name: 'pulseguard_service_checks_failure_total',
      help: 'Total number of failed health checks (including timeouts and errors) executed for the service monitor',
      labelNames: ['service_id', 'service_name', 'target_url'],
      registers: [this.registry],
    });

    this.serviceLatencyGauge = new Gauge({
      name: 'pulseguard_service_latency_percentile_ms',
      help: 'Sliding window response latency percentiles in milliseconds',
      labelNames: ['service_id', 'service_name', 'target_url', 'percentile'],
      registers: [this.registry],
    });
  }

  private calculatePercentile(latencies: number[], percentile: number): number {
    if (latencies.length === 0) return 0;
    const sorted = [...latencies].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  async getMetrics(): Promise<string> {
    // 1. Reset/Clean labels before fetching new metrics
    this.serviceStatusGauge.reset();
    this.serviceAvailabilityGauge.reset();
    this.serviceTotalRequestsGauge.reset();
    this.serviceSuccessCountGauge.reset();
    this.serviceFailureCountGauge.reset();
    this.serviceLatencyGauge.reset();

    // 2. Query Global Metrics
    const allServices = await this.prisma.service.findMany();
    this.totalServicesGauge.set(allServices.length);

    // Group services by status
    const statusCounts = {
      [ServiceStatus.HEALTHY]: 0,
      [ServiceStatus.DEGRADED]: 0,
      [ServiceStatus.DOWN]: 0,
      [ServiceStatus.RECOVERING]: 0,
      [ServiceStatus.UNKNOWN]: 0,
    };
    for (const s of allServices) {
      statusCounts[s.status]++;
    }
    for (const [status, count] of Object.entries(statusCounts)) {
      this.serviceStatusGauge.set({ status }, count);
    }

    // Active incidents
    const activeIncidentsCount = await this.prisma.incident.count({
      where: {
        status: { in: [IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED] },
      },
    });
    this.activeIncidentsGauge.set(activeIncidentsCount);

    // 3. Query Per-Service Metrics
    for (const s of allServices) {
      // Find all checks for success/failure metrics
      const successCount = await this.prisma.serviceCheck.count({
        where: { serviceId: s.id, status: CheckStatus.SUCCESS },
      });
      const totalCount = await this.prisma.serviceCheck.count({
        where: { serviceId: s.id },
      });
      const failureCount = totalCount - successCount;

      const labels = {
        service_id: s.id,
        service_name: s.name,
        target_url: s.targetUrl,
      };

      this.serviceTotalRequestsGauge.set(labels, totalCount);
      this.serviceSuccessCountGauge.set(labels, successCount);
      this.serviceFailureCountGauge.set(labels, failureCount);

      const availabilityRatio =
        totalCount > 0 ? successCount / totalCount : 1.0;
      this.serviceAvailabilityGauge.set(labels, availabilityRatio);

      // 4. Query Latencies for Percentiles (sliding window of last 100 checks)
      const recentChecks = await this.prisma.serviceCheck.findMany({
        where: {
          serviceId: s.id,
          responseTimeMs: { not: null },
        },
        orderBy: { checkedAt: 'desc' },
        take: 100,
        select: { responseTimeMs: true },
      });

      const latencies = recentChecks
        .map((c) => c.responseTimeMs)
        .filter((val): val is number => val !== null);

      const percentiles = [
        { label: 'p50', val: 50 },
        { label: 'p90', val: 90 },
        { label: 'p95', val: 95 },
        { label: 'p99', val: 99 },
      ];

      for (const p of percentiles) {
        const value = this.calculatePercentile(latencies, p.val);
        this.serviceLatencyGauge.set({ ...labels, percentile: p.label }, value);
      }
    }

    return this.registry.metrics();
  }

  async getSummary(userId: string, userRole: UserRole) {
    const whereClause: { userId?: string } = {};

    // Role scope: Viewers only see statistics for their own services
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.OPERATOR) {
      whereClause.userId = userId;
    }

    const services = await this.prisma.service.findMany({
      where: whereClause,
    });

    const statusCounts = {
      [ServiceStatus.HEALTHY]: 0,
      [ServiceStatus.DEGRADED]: 0,
      [ServiceStatus.DOWN]: 0,
      [ServiceStatus.RECOVERING]: 0,
      [ServiceStatus.UNKNOWN]: 0,
    };

    for (const s of services) {
      statusCounts[s.status]++;
    }

    // Incidents count
    const incidentWhereClause: {
      status: { in: IncidentStatus[] };
      service?: {
        userId: string;
      };
    } = {
      status: { in: [IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED] },
    };

    if (userRole !== UserRole.ADMIN && userRole !== UserRole.OPERATOR) {
      incidentWhereClause.service = {
        userId,
      };
    }

    const activeIncidents = await this.prisma.incident.count({
      where: incidentWhereClause,
    });

    return {
      totalServices: services.length,
      activeIncidents,
      statusBreakdown: statusCounts,
    };
  }
}
