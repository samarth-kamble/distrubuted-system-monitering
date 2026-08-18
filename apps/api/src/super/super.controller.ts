import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SuperService } from './super.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('super')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperController {
  constructor(private readonly superService: SuperService) {}

  @Get('tenants')
  async getTenants() {
    return this.superService.getTenants();
  }

  @Get('users')
  async getAllUsers() {
    return this.superService.getAllUsers();
  }

  @Get('audit-logs')
  async getAllAuditLogs(
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const parsedSkip = skip ? parseInt(skip, 10) : undefined;
    return this.superService.getAllAuditLogs(parsedLimit, parsedSkip);
  }
}
