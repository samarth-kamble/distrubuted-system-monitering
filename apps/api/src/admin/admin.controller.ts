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

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Roles(UserRole.ADMIN)
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Patch('users/:id/role')
  @Roles(UserRole.ADMIN)
  @Audit({ action: 'update_role', resource: 'user', resourceIdParam: 'id' })
  async updateUserRole(@Param('id') id: string, @Body('role') role: UserRole) {
    return this.adminService.updateUserRole(id, role);
  }

  @Get('audit-logs')
  @Roles(UserRole.ADMIN)
  async getAuditLogs(
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const parsedSkip = skip ? parseInt(skip, 10) : undefined;
    return this.adminService.getAuditLogs(parsedLimit, parsedSkip);
  }
}
