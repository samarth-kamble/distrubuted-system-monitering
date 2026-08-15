import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisLockService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisLockService.name);
  private readonly redis: Redis;

  constructor() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    this.logger.log(`Connecting to Redis Lock Provider at ${host}:${port}`);
    this.redis = new Redis({ host, port });
  }

  async acquireLock(
    key: string,
    value: string,
    ttlMs: number,
  ): Promise<boolean> {
    try {
      const result = await this.redis.set(key, value, 'PX', ttlMs, 'NX');
      return result === 'OK';
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error(`Failed to acquire lock for key ${key}:`, error);
      return false;
    }
  }

  async releaseLock(key: string, value: string): Promise<boolean> {
    try {
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      const result = await this.redis.eval(script, 1, key, value);
      return result === 1;
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error(`Failed to release lock for key ${key}:`, error);
      return false;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Closing Redis connection...');
    await this.redis.quit();
  }
}
