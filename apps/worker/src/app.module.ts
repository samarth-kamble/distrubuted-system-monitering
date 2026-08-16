import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { HealthCheckProcessor } from './health-check.processor';
import { HttpProberService } from './prober/http-prober.service';
import { RedisLockService } from './prober/lock.service';
import { CircuitBreakerService } from './prober/circuit-breaker.service';
import { CircuitEventListener } from './prober/events/circuit-event.listener';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    EventEmitterModule.forRoot(),
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
    CircuitBreakerService,
    CircuitEventListener,
  ],
})
export class AppModule {}
