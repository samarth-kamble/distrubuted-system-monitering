import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuperService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenants() {
    return this.prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            services: true,
            auditLogs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllAuditLogs(limit = 100, skip = 0) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
