import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';
import { AUDIT_KEY, AuditOptions } from './audit.decorator';
import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

interface AuditLogResponse {
  id?: string;
  user?: {
    id: string;
  };
  [key: string]: unknown;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.get<AuditOptions>(
      AUDIT_KEY,
      context.getHandler(),
    );

    if (!auditOptions) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((response: unknown) => {
        void this.logAudit(context, auditOptions, response);
      }),
    );
  }

  private async logAudit(
    context: ExecutionContext,
    auditOptions: AuditOptions,
    response: unknown,
  ): Promise<void> {
    try {
      const request = context.switchToHttp().getRequest<RequestWithUser>();
      const responseObj = context.switchToHttp().getResponse<Response>();

      const user = request.user;
      const userId = user?.id || null;
      const ipAddress =
        request.ip || request.headers['x-forwarded-for']?.toString() || null;
      const userAgent = request.headers['user-agent'] || null;

      let resourceId: string | null = null;
      if (auditOptions.resourceIdParam) {
        const bodyParam = request.body as Record<string, unknown>;
        const paramValue =
          request.params[auditOptions.resourceIdParam] ||
          bodyParam[auditOptions.resourceIdParam];
        if (paramValue !== undefined && paramValue !== null) {
          if (typeof paramValue === 'string') {
            resourceId = paramValue;
          } else if (
            typeof paramValue === 'number' ||
            typeof paramValue === 'boolean'
          ) {
            resourceId = String(paramValue);
          }
        }
      }

      let finalUserId = userId;
      let finalResourceId = resourceId;

      if (response && typeof response === 'object') {
        const typedResponse = response as AuditLogResponse;

        if (!finalUserId) {
          if (typedResponse.user?.id) {
            finalUserId = typedResponse.user.id;
          } else if (typedResponse.id) {
            finalUserId = typedResponse.id;
          }
        }

        if (!finalResourceId && auditOptions.resourceIdParam) {
          const resValue =
            typedResponse[auditOptions.resourceIdParam] || typedResponse.id;
          if (resValue !== undefined && resValue !== null) {
            if (typeof resValue === 'string') {
              finalResourceId = resValue;
            } else if (
              typeof resValue === 'number' ||
              typeof resValue === 'boolean'
            ) {
              finalResourceId = String(resValue);
            }
          }
        }
      }

      await this.prisma.auditLog.create({
        data: {
          userId: finalUserId,
          action: auditOptions.action,
          resource: auditOptions.resource,
          resourceId: finalResourceId,
          ipAddress,
          userAgent,
          metadata: {
            statusCode: responseObj.statusCode,
            query: request.query,
          },
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }
}
