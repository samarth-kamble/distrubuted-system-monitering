import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, IncidentStatus } from '@prisma/client';
import { Audit } from '../auth/audit.decorator';
import { Request as ExpressRequest } from 'express';

interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER)
  findAll(
    @Request() req: RequestWithUser,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
    @Query('status') status?: IncidentStatus,
    @Query('serviceId') serviceId?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const parsedSkip = skip ? parseInt(skip, 10) : undefined;
    return this.incidentsService.findAll(
      req.user.id,
      req.user.role,
      parsedLimit,
      parsedSkip,
      status,
      serviceId,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER)
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.incidentsService.findOne(req.user.id, req.user.role, id);
  }

  @Post(':id/acknowledge')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @Audit({ action: 'acknowledge', resource: 'incident', resourceIdParam: 'id' })
  acknowledge(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.incidentsService.acknowledge(req.user.id, req.user.role, id);
  }

  @Post(':id/resolve')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @Audit({ action: 'resolve', resource: 'incident', resourceIdParam: 'id' })
  resolve(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.incidentsService.resolve(req.user.id, req.user.role, id);
  }
}
