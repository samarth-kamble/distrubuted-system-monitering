import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async findAll(userId: string, userRole: UserRole) {
    if (userRole === UserRole.ADMIN) {
      return this.prisma.service.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.service.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, userRole: UserRole, id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    if (userRole !== UserRole.ADMIN && service.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this service',
      );
    }

    return service;
  }

  async update(
    userId: string,
    userRole: UserRole,
    id: string,
    dto: UpdateServiceDto,
  ) {
    await this.findOne(userId, userRole, id);

    return this.prisma.service.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, userRole: UserRole, id: string) {
    await this.findOne(userId, userRole, id);

    return this.prisma.service.delete({
      where: { id },
    });
  }
}
