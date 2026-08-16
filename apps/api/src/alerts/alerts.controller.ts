import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, AlertSeverity, AlertType } from '@prisma/client';
import { Request as ExpressRequest } from 'express';

interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER)
  findAll(
    @Request() req: RequestWithUser,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
    @Query('severity') severity?: AlertSeverity,
    @Query('serviceId') serviceId?: string,
    @Query('type') type?: AlertType,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const parsedSkip = skip ? parseInt(skip, 10) : undefined;
    return this.alertsService.findAll(
      req.user.id,
      req.user.role,
      parsedLimit,
      parsedSkip,
      severity,
      serviceId,
      type,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER)
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.alertsService.findOne(req.user.id, req.user.role, id);
  }
}
