import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  override async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { context, throttler } = requestProps;
    const req = context.switchToHttp().getRequest<Request>();
    const path = req.url;

    // Apply 'auth' throttler only to /auth routes
    if (throttler.name === 'auth') {
      if (!path.includes('/auth/')) {
        return true; // Skip auth limits for non-auth routes
      }
    }

    // Apply 'api' throttler only to non-auth routes
    if (throttler.name === 'api') {
      if (path.includes('/auth/')) {
        return true; // Skip api limits for auth routes
      }
    }

    return super.handleRequest(requestProps);
  }
}
