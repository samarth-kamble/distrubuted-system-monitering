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
  };
}

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @Audit({ action: 'create', resource: 'service', resourceIdParam: 'id' })
  create(@Request() req: RequestWithUser, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(req.user.id, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER)
  findAll(@Request() req: RequestWithUser) {
    return this.servicesService.findAll(req.user.id, req.user.role);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER)
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.servicesService.findOne(req.user.id, req.user.role, id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @Audit({ action: 'update', resource: 'service', resourceIdParam: 'id' })
  update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(req.user.id, req.user.role, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Audit({ action: 'delete', resource: 'service', resourceIdParam: 'id' })
  remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.servicesService.remove(req.user.id, req.user.role, id);
  }
}
