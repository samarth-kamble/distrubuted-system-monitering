import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawMessage =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    let message: string | string[] = 'Internal server error';
    if (typeof rawMessage === 'string') {
      message = rawMessage;
    } else if (
      typeof rawMessage === 'object' &&
      rawMessage !== null &&
      'message' in rawMessage
    ) {
      const msg = (rawMessage as Record<string, unknown>).message;
      if (typeof msg === 'string') {
        message = msg;
      } else if (Array.isArray(msg)) {
        message = msg.map(String);
      }
    }

    const requestId = (request.headers['x-request-id'] as string) || '';

    const responseBody: {
      statusCode: number;
      timestamp: string;
      path: string;
      requestId: string;
      message: string | string[];
      stack?: string;
    } = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
      message,
    };

    // Mask stack traces in production (NODE_ENV = production)
    if (
      process.env.NODE_ENV !== 'production' &&
      !(exception instanceof HttpException)
    ) {
      responseBody.stack =
        exception instanceof Error ? exception.stack : String(exception);
    }

    response.status(status).json(responseBody);
  }
}
