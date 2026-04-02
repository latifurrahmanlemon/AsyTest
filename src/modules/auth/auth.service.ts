import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { compare, hash } from 'bcryptjs';
import { IsNull, Repository } from 'typeorm';
import { RequestUser } from '../../common/auth/request-user.interface';
import { UserRole } from '../../common/auth/role.enum';
import { CryptoService } from '../../common/services/crypto.service';
import { PasswordResetTokenEntity } from '../../database/entities/password-reset-token.entity';
import { TenantEntity } from '../../database/entities/tenant.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { AuditLogService } from '../observability/audit-log.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';
import { AccessTokenPayload, AuthResponse } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PasswordResetTokenEntity)
    private readonly passwordResetTokenRepository: Repository<PasswordResetTokenEntity>,
    private readonly jwtService: JwtService,
    private readonly cryptoService: CryptoService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async signup(payload: SignupDto): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findOne({
      where: { email: payload.email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException('An account with this email already exists');
    }

    const tenant = this.tenantRepository.create({
      name: payload.tenantName.trim(),
      slug: await this.generateTenantSlug(payload.tenantName),
    });
    await this.tenantRepository.save(tenant);

    const user = this.userRepository.create({
      tenantId: tenant.id,
      fullName: payload.fullName.trim(),
      email: payload.email.toLowerCase().trim(),
      passwordHash: await hash(payload.password, 10),
      role: UserRole.ADMIN,
      isActive: true,
    });
    await this.userRepository.save(user);

    await this.auditLogService.record({
      tenantId: tenant.id,
      userId: user.id,
      level: 'info',
      event: 'auth.signup.completed',
      resourceType: 'user',
      resourceId: user.id,
      message: `Tenant ${tenant.name} and initial admin user created`,
      metadata: {
        email: user.email,
        role: user.role,
      },
    });

    return this.buildAuthResponse(user, tenant.name);
  }

  async login(payload: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({
      where: { email: payload.email.toLowerCase().trim() },
      relations: { tenant: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await compare(payload.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.auditLogService.record({
      tenantId: user.tenantId,
      userId: user.id,
      level: 'info',
      event: 'auth.login.completed',
      resourceType: 'user',
      resourceId: user.id,
      message: `User ${user.email} logged in`,
    });

    return this.buildAuthResponse(user, user.tenant.name);
  }

  async forgotPassword(payload: ForgotPasswordDto): Promise<{
    message: string;
    previewToken?: string;
  }> {
    const user = await this.userRepository.findOne({
      where: { email: payload.email.toLowerCase().trim() },
      relations: { tenant: true },
    });

    if (!user || !user.isActive) {
      return {
        message:
          'If a matching account exists, a password reset token has been generated',
      };
    }

    const rawToken = randomBytes(24).toString('hex');
    const expiresAt = new Date(
      Date.now() +
        this.readPositiveInteger(
          process.env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES,
          30,
        ) *
          60 *
          1000,
    );

    const token = this.passwordResetTokenRepository.create({
      userId: user.id,
      tokenHash: this.cryptoService.hashToken(rawToken),
      expiresAt,
      usedAt: null,
    });
    await this.passwordResetTokenRepository.save(token);

    await this.auditLogService.record({
      tenantId: user.tenantId,
      userId: user.id,
      level: 'warn',
      event: 'auth.password_reset.requested',
      resourceType: 'user',
      resourceId: user.id,
      message: `Password reset requested for ${user.email}`,
      metadata: {
        expiresAt: expiresAt.toISOString(),
      },
    });

    return {
      message:
        'If a matching account exists, a password reset token has been generated',
      previewToken:
        process.env.NODE_ENV === 'production' ? undefined : rawToken,
    };
  }

  async resetPassword(payload: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = this.cryptoService.hashToken(payload.token);
    const record = await this.passwordResetTokenRepository.findOne({
      where: { tokenHash, usedAt: IsNull() },
      relations: { user: { tenant: true } },
    });

    if (!record || record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('The reset token is invalid or expired');
    }

    record.usedAt = new Date();
    record.user.passwordHash = await hash(payload.newPassword, 10);

    await this.userRepository.save(record.user);
    await this.passwordResetTokenRepository.save(record);

    await this.auditLogService.record({
      tenantId: record.user.tenantId,
      userId: record.user.id,
      level: 'warn',
      event: 'auth.password_reset.completed',
      resourceType: 'user',
      resourceId: record.user.id,
      message: `Password reset completed for ${record.user.email}`,
    });

    return {
      message: 'Password updated successfully',
    };
  }

  async getProfile(currentUser: RequestUser): Promise<AuthResponse['user']> {
    const user = await this.userRepository.findOne({
      where: { id: currentUser.userId, tenantId: currentUser.tenantId },
      relations: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Authenticated user no longer exists');
    }

    return {
      id: user.id,
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
  }

  async validateAccessToken(token: string): Promise<RequestUser> {
    let payload: AccessTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: process.env.JWT_ACCESS_TOKEN_SECRET ?? 'change-me-in-production',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const user = await this.userRepository.findOne({
      where: {
        id: payload.sub,
        tenantId: payload.tenantId,
        email: payload.email,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Authenticated user no longer exists');
    }

    return {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };
  }

  private async buildAuthResponse(
    user: UserEntity,
    tenantName: string,
  ): Promise<AuthResponse> {
    const token = await this.jwtService.signAsync(
      {
        sub: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role,
      } satisfies AccessTokenPayload,
      {
        secret: process.env.JWT_ACCESS_TOKEN_SECRET ?? 'change-me-in-production',
        expiresIn: (process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? '1d') as never,
      },
    );

    return {
      accessToken: token,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        tenantName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  private async generateTenantSlug(name: string): Promise<string> {
    const base = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120) || 'tenant';

    let slug = base;
    let attempt = 1;

    while (await this.tenantRepository.findOne({ where: { slug } })) {
      slug = `${base}-${attempt}`;
      attempt += 1;
    }

    return slug;
  }

  private readPositiveInteger(rawValue: string | undefined, fallback: number): number {
    const parsed = Number(rawValue);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }
}
