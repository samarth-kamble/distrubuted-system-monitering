import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { IncidentsService } from './incidents.service';
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
  };
}

@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER)
  findAll(@Request() req: RequestWithUser) {
    return this.incidentsService.findAll(req.user.id, req.user.role);
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
}
