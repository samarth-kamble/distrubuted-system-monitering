import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertType, AlertSeverity } from '@prisma/client';
import {
  CircuitOpenedEvent,
  CircuitClosedEvent,
  CircuitHalfOpenEvent,
} from './circuit.events';

@Injectable()
export class CircuitEventListener {
  private readonly logger = new Logger(CircuitEventListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('circuit.opened')
  async handleCircuitOpened(event: CircuitOpenedEvent) {
    const service = await this.prisma.service.findUnique({
      where: { id: event.serviceId },
    });
    const serviceName = service?.name || 'Unknown Service';

    this.logger.log(
      `[EventListener] Circuit opened for service: ${serviceName} (${event.serviceId})`,
    );

    await this.prisma.alert.create({
      data: {
        serviceId: event.serviceId,
        type: AlertType.CIRCUIT_OPENED,
        title: 'Circuit Breaker Opened',
        message: `The health check circuit for service "${serviceName}" has been opened due to successive failures. Polling requests are now short-circuited.`,
        severity: AlertSeverity.CRITICAL,
      },
    });
  }

  @OnEvent('circuit.closed')
  async handleCircuitClosed(event: CircuitClosedEvent) {
    const service = await this.prisma.service.findUnique({
      where: { id: event.serviceId },
    });
    const serviceName = service?.name || 'Unknown Service';

    this.logger.log(
      `[EventListener] Circuit closed for service: ${serviceName} (${event.serviceId})`,
    );

    await this.prisma.alert.create({
      data: {
        serviceId: event.serviceId,
        type: AlertType.CIRCUIT_CLOSED,
        title: 'Circuit Breaker Closed',
        message: `The health check circuit for service "${serviceName}" has closed. Normal polling has resumed.`,
        severity: AlertSeverity.INFO,
      },
    });
  }

  @OnEvent('circuit.half-open')
  async handleCircuitHalfOpen(event: CircuitHalfOpenEvent) {
    const service = await this.prisma.service.findUnique({
      where: { id: event.serviceId },
    });
    const serviceName = service?.name || 'Unknown Service';

    this.logger.log(
      `[EventListener] Circuit half-opened for service: ${serviceName} (${event.serviceId})`,
    );

    await this.prisma.alert.create({
      data: {
        serviceId: event.serviceId,
        type: AlertType.CIRCUIT_HALF_OPEN,
        title: 'Circuit Breaker Half-Open',
        message: `The health check circuit for service "${serviceName}" is now half-open. Emitting a single trial probe to test recovery.`,
        severity: AlertSeverity.MEDIUM,
      },
    });
  }
}
