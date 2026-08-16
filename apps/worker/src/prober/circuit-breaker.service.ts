import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import {
  CircuitOpenedEvent,
  CircuitClosedEvent,
  CircuitHalfOpenEvent,
} from './events/circuit.events';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

@Injectable()
export class CircuitBreakerService implements OnModuleDestroy {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly redis: Redis;

  constructor(private readonly eventEmitter: EventEmitter2) {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    this.logger.log(
      `Connecting to Redis Circuit Breaker Provider at ${host}:${port}`,
    );
    this.redis = new Redis({ host, port });
  }

  private getStateKey(serviceId: string): string {
    return `circuit:state:${serviceId}`;
  }

  private getOpenedAtKey(serviceId: string): string {
    return `circuit:opened_at:${serviceId}`;
  }

  async getState(serviceId: string): Promise<CircuitState> {
    try {
      const state = (await this.redis.get(
        this.getStateKey(serviceId),
      )) as CircuitState | null;
      if (!state) {
        return CircuitState.CLOSED;
      }

      if (state === CircuitState.OPEN) {
        const openedAtStr = await this.redis.get(
          this.getOpenedAtKey(serviceId),
        );
        if (openedAtStr) {
          const openedAt = parseInt(openedAtStr, 10);
          const elapsed = Date.now() - openedAt;
          const recoveryTimeoutMs = 60000; // 60 seconds recovery timeout
          if (elapsed > recoveryTimeoutMs) {
            this.logger.log(
              `Circuit recovery timeout reached for service ${serviceId}. Upgrading to HALF_OPEN.`,
            );
            await this.transitionTo(serviceId, CircuitState.HALF_OPEN);
            return CircuitState.HALF_OPEN;
          }
        } else {
          // Fallback if openedAt timestamp is somehow missing: record it as now
          await this.redis.set(
            this.getOpenedAtKey(serviceId),
            Date.now().toString(),
          );
        }
      }

      return state;
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error(`Error getting circuit state for ${serviceId}:`, error);
      return CircuitState.CLOSED;
    }
  }

  async transitionTo(serviceId: string, state: CircuitState): Promise<void> {
    try {
      const rawState = (await this.redis.get(
        this.getStateKey(serviceId),
      )) as CircuitState | null;
      const currentState = rawState || CircuitState.CLOSED;

      if (currentState === state) {
        return;
      }

      this.logger.log(
        `Circuit for service ${serviceId} transitioning from ${currentState} to: ${state}`,
      );

      const stateKey = this.getStateKey(serviceId);
      await this.redis.set(stateKey, state);

      if (state === CircuitState.OPEN) {
        const openedAtKey = this.getOpenedAtKey(serviceId);
        const now = Date.now();
        await this.redis.set(openedAtKey, now.toString());
        this.eventEmitter.emit(
          'circuit.opened',
          new CircuitOpenedEvent(serviceId, now),
        );
      } else {
        await this.redis.del(this.getOpenedAtKey(serviceId));

        if (state === CircuitState.CLOSED) {
          this.eventEmitter.emit(
            'circuit.closed',
            new CircuitClosedEvent(serviceId, Date.now()),
          );
        } else if (state === CircuitState.HALF_OPEN) {
          this.eventEmitter.emit(
            'circuit.half-open',
            new CircuitHalfOpenEvent(serviceId, Date.now()),
          );
        }
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error(
        `Error transitioning circuit state for ${serviceId} to ${state}:`,
        error,
      );
    }
  }

  async onModuleDestroy() {
    this.logger.log('Closing Redis connection...');
    await this.redis.quit();
  }
}
