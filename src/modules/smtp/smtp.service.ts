import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestUser } from '../../common/auth/request-user.interface';
import { CryptoService } from '../../common/services/crypto.service';
import { SmtpConfigEntity } from '../../database/entities/smtp-config.entity';
import { AuditLogService } from '../observability/audit-log.service';
import { UpsertSmtpConfigDto } from './dto/upsert-smtp-config.dto';
import { SmtpMailerService } from './smtp-mailer.service';
import { DecryptedSmtpConfig, PublicSmtpConfig } from './smtp.types';

@Injectable()
export class SmtpService {
  constructor(
    @InjectRepository(SmtpConfigEntity)
    private readonly smtpConfigRepository: Repository<SmtpConfigEntity>,
    private readonly cryptoService: CryptoService,
    private readonly auditLogService: AuditLogService,
    private readonly smtpMailerService: SmtpMailerService,
  ) {}

  async getPublicConfig(currentUser: RequestUser): Promise<PublicSmtpConfig> {
    const config = await this.smtpConfigRepository.findOne({
      where: { tenantId: currentUser.tenantId },
    });

    if (!config) {
      return {
        id: null,
        host: null,
        port: null,
        secure: false,
        username: null,
        fromEmail: null,
        fromName: null,
        hasPassword: false,
        updatedAt: null,
      };
    }

    return this.toPublicConfig(config);
  }

  async upsertConfig(
    currentUser: RequestUser,
    payload: UpsertSmtpConfigDto,
  ): Promise<PublicSmtpConfig> {
    const username = this.normalizeOptionalString(payload.username);
    const password = this.normalizeOptionalString(payload.password);

    if (!username && password) {
      throw new BadRequestException(
        'SMTP username is required when a password is provided',
      );
    }

    let config = await this.smtpConfigRepository.findOne({
      where: { tenantId: currentUser.tenantId },
    });

    if (
      username &&
      !password &&
      (!config || config.username !== username || !config.passwordEncrypted)
    ) {
      throw new BadRequestException(
        'SMTP password is required when setting a new SMTP username',
      );
    }

    if (!config) {
      config = this.smtpConfigRepository.create({
        tenantId: currentUser.tenantId,
      });
    }

    config.host = payload.host.trim();
    config.port = payload.port;
    config.secure = payload.secure;
    config.username = username ?? null;
    config.passwordEncrypted = password
      ? this.cryptoService.encrypt(password)
      : username && config.passwordEncrypted
        ? config.passwordEncrypted
        : null;
    config.fromEmail = payload.fromEmail.trim().toLowerCase();
    config.fromName = this.normalizeOptionalString(payload.fromName) ?? null;

    await this.smtpConfigRepository.save(config);

    await this.auditLogService.record({
      tenantId: currentUser.tenantId,
      userId: currentUser.userId,
      level: 'info',
      event: 'smtp.config.updated',
      resourceType: 'smtp_config',
      resourceId: config.id,
      message: `SMTP configuration updated for tenant ${currentUser.tenantId}`,
      metadata: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        username: config.username,
        fromEmail: config.fromEmail,
      },
    });

    return this.toPublicConfig(config);
  }

  async testCurrentConfig(currentUser: RequestUser): Promise<{ ok: true }> {
    const config = await this.getDecryptedConfigForTenant(currentUser.tenantId);
    await this.smtpMailerService.verifyConnection(config);

    await this.auditLogService.record({
      tenantId: currentUser.tenantId,
      userId: currentUser.userId,
      level: 'info',
      event: 'smtp.config.verified',
      resourceType: 'smtp_config',
      resourceId: config.id,
      message: `SMTP configuration verified for tenant ${currentUser.tenantId}`,
    });

    return { ok: true };
  }

  async getDecryptedConfigForTenant(tenantId: string): Promise<DecryptedSmtpConfig> {
    const config = await this.smtpConfigRepository.findOne({
      where: { tenantId },
    });

    if (!config) {
      throw new NotFoundException('SMTP configuration has not been set for this tenant');
    }

    return {
      id: config.id,
      tenantId: config.tenantId,
      host: config.host,
      port: config.port,
      secure: config.secure,
      username: config.username,
      password: config.passwordEncrypted
        ? this.cryptoService.decrypt(config.passwordEncrypted)
        : null,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  private toPublicConfig(config: SmtpConfigEntity): PublicSmtpConfig {
    return {
      id: config.id,
      host: config.host,
      port: config.port,
      secure: config.secure,
      username: config.username,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      hasPassword: Boolean(config.passwordEncrypted),
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  private normalizeOptionalString(value?: string): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }
}
