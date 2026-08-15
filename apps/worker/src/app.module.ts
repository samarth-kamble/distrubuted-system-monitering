import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { HealthCheckProcessor } from './health-check.processor';
import { HttpProberService } from './prober/http-prober.service';
import { RedisLockService } from './prober/lock.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue({
      name: 'health-check',
    }),
  ],
  controllers: [],
  providers: [
    AppService,
    HealthCheckProcessor,
    HttpProberService,
    RedisLockService,
  ],
})
export class AppModule {}
