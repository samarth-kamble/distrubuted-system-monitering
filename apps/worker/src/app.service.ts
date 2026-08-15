import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('health-check') private readonly healthCheckQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleHeartbeatCheck() {
    this.logger.log(
      'Starting sync of active monitors with background queue...',
    );

    try {
      const activeServices = await this.prisma.service.findMany({
        where: { enabled: true },
      });

      const existingSchedulers = await this.healthCheckQueue.getJobSchedulers();
      const activeServiceIds = new Set(activeServices.map((s) => s.id));

      for (const scheduler of existingSchedulers) {
        if (!scheduler.id) {
          continue;
        }

        if (!activeServiceIds.has(scheduler.id)) {
          this.logger.log(
            `[Sync] Removing obsolete job scheduler for service ID: ${scheduler.id}`,
          );
          await this.healthCheckQueue.removeJobScheduler(scheduler.id);
        }
      }

      for (const service of activeServices) {
        const expectedIntervalMs = service.intervalSeconds * 1000;
        this.logger.log(
          `[Sync] Ensuring job scheduler for service: ${service.name} (every ${service.intervalSeconds}s)`,
        );
        await this.healthCheckQueue.upsertJobScheduler(
          service.id,
          { every: expectedIntervalMs },
          {
            name: 'check',
            data: { serviceId: service.id },
          },
        );
      }

      this.logger.log(
        `[Sync] Completed reconciliation loop. Active services synced: ${activeServices.length}.`,
      );
    } catch (error) {
      this.logger.error(
        '[Sync] Error during database/queue synchronization:',
        error,
      );
    }
  }
}
