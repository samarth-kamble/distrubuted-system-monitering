import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { Audit } from '../auth/audit.decorator';

import { Request } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    email: string;
    role: UserRole;
    tenantId: string | null;
  };
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getUsers(@Request() req: RequestWithUser) {
    return this.adminService.getUsers(req.user.tenantId);
  }

  @Patch('users/:id/role')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Audit({ action: 'update_role', resource: 'user', resourceIdParam: 'id' })
  async updateUserRole(
    @Request() req: RequestWithUser,
    @Param('id') id: string, 
    @Body('role') role: UserRole
  ) {
    return this.adminService.updateUserRole(id, role, req.user.tenantId);
  }

  @Get('audit-logs')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getAuditLogs(
    @Request() req: RequestWithUser,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const parsedSkip = skip ? parseInt(skip, 10) : undefined;
    return this.adminService.getAuditLogs(parsedLimit, parsedSkip, req.user.tenantId);
  }
}
