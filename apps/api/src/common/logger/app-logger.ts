import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';
import { loggerStorage } from './logger-storage';

@Injectable()
export class AppLogger extends ConsoleLogger {
  protected override formatMessage(
    logLevel: LogLevel,
    message: unknown,
    pidMessage: string,
    formattedLogLevel: string,
    contextMessage: string,
    timestampDiff: string,
  ): string {
    const requestId = loggerStorage.getStore();
    const idPrefix = requestId ? `[Correlation ID: ${requestId}] ` : '';
    const formatted = super.formatMessage(
      logLevel,
      message,
      pidMessage,
      formattedLogLevel,
      contextMessage,
      timestampDiff,
    );
    return `${idPrefix}${formatted}`;
  }
}
