import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async generateTokens(
    user: Omit<User, 'passwordHash'>,
    existingFamily?: string,
  ) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    // Generate secure cryptographically random refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const family = existingFamily || crypto.randomUUID();

    // Set expiry to 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        family,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash: hashedPassword,
        name: dto.name || dto.email.split('@')[0],
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      dto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userResult } = user;

    // Update lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(userResult);

    return {
      user: userResult,
      ...tokens,
    };
  }

  async refresh(token: string) {
    if (!token) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const tokenHash = this.hashToken(token);

    const dbToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!dbToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 1. REUSE DETECTION (Replay Attack):
    // Invalidate the entire family if token is already revoked
    if (dbToken.revokedAt !== null) {
      await this.prisma.refreshToken.updateMany({
        where: { family: dbToken.family },
        data: { revokedAt: new Date() },
      });

      throw new UnauthorizedException(
        'Session compromised. Token reuse detected and all related sessions revoked.',
      );
    }

    // 2. EXPIRATION CHECK:
    if (dbToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // 3. ROTATION (RTR):
    // Revoke the current used token
    await this.prisma.refreshToken.update({
      where: { id: dbToken.id },
      data: { revokedAt: new Date() },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userResult } = dbToken.user;

    const tokens = await this.generateTokens(userResult, dbToken.family);

    return {
      user: userResult,
      ...tokens,
    };
  }

  async logout(token: string) {
    if (!token) {
      return;
    }

    const tokenHash = this.hashToken(token);

    const dbToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (dbToken) {
      await this.prisma.refreshToken.update({
        where: { id: dbToken.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  async validateUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }
}
