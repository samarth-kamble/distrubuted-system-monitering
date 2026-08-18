import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { Audit } from '../auth/audit.decorator';
import { Request as ExpressRequest } from 'express';

interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    email: string;
    role: UserRole;
    tenantId: string | null;
  };
}

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Audit({ action: 'create', resource: 'service', resourceIdParam: 'id' })
  create(@Request() req: RequestWithUser, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(req.user.id, req.user.tenantId, dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER)
  findAll(@Request() req: RequestWithUser) {
    return this.servicesService.findAll(req.user.id, req.user.tenantId, req.user.role);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER)
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.servicesService.findOne(req.user.id, req.user.tenantId, req.user.role, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
  @Audit({ action: 'update', resource: 'service', resourceIdParam: 'id' })
  update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(req.user.id, req.user.tenantId, req.user.role, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Audit({ action: 'delete', resource: 'service', resourceIdParam: 'id' })
  remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.servicesService.remove(req.user.id, req.user.tenantId, req.user.role, id);
  }

  @Post(':id/enable')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
  @Audit({ action: 'enable', resource: 'service', resourceIdParam: 'id' })
  enable(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.servicesService.enable(req.user.id, req.user.tenantId, req.user.role, id);
  }

  @Post(':id/disable')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
  @Audit({ action: 'disable', resource: 'service', resourceIdParam: 'id' })
  disable(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.servicesService.disable(req.user.id, req.user.tenantId, req.user.role, id);
  }

  @Get(':id/checks')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER)
  findChecks(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const parsedSkip = skip ? parseInt(skip, 10) : undefined;
    return this.servicesService.findChecks(
      req.user.id,
      req.user.tenantId,
      req.user.role,
      id,
      parsedLimit,
      parsedSkip,
    );
  }

  @Get(':id/metrics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER)
  getMetrics(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.servicesService.getMetrics(req.user.id, req.user.tenantId, req.user.role, id);
  }
}
