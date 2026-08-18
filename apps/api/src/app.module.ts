import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AuditInterceptor } from './auth/audit.interceptor';
import { ServicesModule } from './services/services.module';
import { IncidentsModule } from './incidents/incidents.module';
import { MetricsModule } from './metrics/metrics.module';
import { AlertsModule } from './alerts/alerts.module';
import { AdminModule } from './admin/admin.module';
import { SuperModule } from './super/super.module';
import { SimulationModule } from './simulation/simulation.module';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ServicesModule,
    IncidentsModule,
    MetricsModule,
    AlertsModule,
    AdminModule,
    SuperModule,
    SimulationModule,
    ThrottlerModule.forRoot([
      {
        name: 'auth',
        ttl: 900000, // 15 minutes
        limit: 10,
      },
      {
        name: 'api',
        ttl: 60000, // 1 minute
        limit: 100,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
