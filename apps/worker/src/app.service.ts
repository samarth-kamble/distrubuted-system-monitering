import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleHeartbeatCheck() {
    this.logger.log(
      'Starting background health checks for configured monitors...',
    );

    try {
      // Fetch only enabled services to monitor
      const activeServices = await this.prisma.service.findMany({
        where: { enabled: true },
      });

      // Count disabled services to track skipped health checks
      const disabledCount = await this.prisma.service.count({
        where: { enabled: false },
      });

      this.logger.log(
        `Database check: ${activeServices.length} services are active. Skipped ${disabledCount} disabled services.`,
      );

      // Simulate running health checks on active services
      for (const service of activeServices) {
        this.logger.log(
          `[Heartbeat] Checking service "${service.name}" -> ${service.method} ${service.targetUrl}`,
        );
      }

      this.logger.log('All active monitor heartbeats processed successfully.');
    } catch (error) {
      this.logger.error('Error during monitoring checks execution:', error);
    }
  }
}
