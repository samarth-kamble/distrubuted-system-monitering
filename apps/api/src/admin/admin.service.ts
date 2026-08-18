import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(tenantId: string | null, dto: CreateUserDto) {
    if (!tenantId) {
      throw new ForbiddenException('You must belong to a tenant to create users.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Only allow Viewer or Operator role creation from Admin Console (Admins cannot create other Admins unless required, let's allow ADMIN, VIEWER, OPERATOR but restrict SUPER_ADMIN)
    if (dto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot register a Super Admin account.');
    }

    const hashedPassword = await argon2.hash(dto.password);

    return this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash: hashedPassword,
        name: dto.name,
        role: dto.role,
        tenantId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getUsers(tenantId: string | null) {
    if (!tenantId) {
      return []; // Return empty if user has no tenant (unless they are Super Admin querying via another endpoint)
    }
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserRole(id: string, role: UserRole, tenantId: string | null) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Verify tenant isolation: Admin cannot promote users from another tenant
    if (tenantId && user.tenantId !== tenantId) {
      throw new NotFoundException('You do not have permission to update this user role.');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getAuditLogs(limit = 50, skip = 0, tenantId: string | null) {
    if (!tenantId) {
      return [];
    }
    return this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}
