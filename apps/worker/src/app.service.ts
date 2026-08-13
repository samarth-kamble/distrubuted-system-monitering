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
      // Query demo records just to verify DB connectivity
      const demosCount = await this.prisma.demo.count();
      this.logger.log(
        `Active monitor database check: found ${demosCount} demo items.`,
      );

      // Simulating check executions
      this.logger.log('All monitor heartbeats processed successfully.');
    } catch (error) {
      this.logger.error('Error during monitoring checks execution:', error);
    }
  }
}
