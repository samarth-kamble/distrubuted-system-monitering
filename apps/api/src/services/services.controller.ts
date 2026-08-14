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
import { Audit } from '../auth/audit.decorator';
import { Request as ExpressRequest } from 'express';

interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    email: string;
  };
}

@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Audit({ action: 'create', resource: 'service', resourceIdParam: 'id' })
  create(@Request() req: RequestWithUser, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.servicesService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.servicesService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @Audit({ action: 'update', resource: 'service', resourceIdParam: 'id' })
  update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @Audit({ action: 'delete', resource: 'service', resourceIdParam: 'id' })
  remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.servicesService.remove(req.user.id, id);
  }
}
