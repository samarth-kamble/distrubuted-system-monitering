import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

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

  async findAll(userId: string) {
    return this.prisma.service.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, userId },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return service;
  }

  async update(userId: string, id: string, dto: UpdateServiceDto) {
    // Ensure service exists and belongs to the user
    await this.findOne(userId, id);

    return this.prisma.service.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string) {
    // Ensure service exists and belongs to the user
    await this.findOne(userId, id);

    return this.prisma.service.delete({
      where: { id },
    });
  }
}
