import { BadRequestException, Injectable } from '@nestjs/common';
import { UpsertSmtpConfigDto } from './dto/upsert-smtp-config.dto';
import { PublicSmtpConfig, SmtpConfig } from './models/smtp-config.model';

@Injectable()
export class SmtpConfigService {
  private config: SmtpConfig | null = null;

  upsertConfig(payload: UpsertSmtpConfigDto): PublicSmtpConfig {
    const username = this.normalizeOptionalString(payload.username);
    const password = this.normalizeOptionalString(payload.password);

    if (!username && password) {
      throw new BadRequestException(
        'SMTP username is required when a password is provided',
      );
    }

    if (
      username &&
      !password &&
      (!this.config ||
        this.config.username !== username ||
        !this.config.password)
    ) {
      throw new BadRequestException(
        'SMTP password is required when setting a new SMTP username',
      );
    }

    const normalized: SmtpConfig = {
      host: payload.host.trim(),
      port: payload.port,
      secure: payload.secure,
      username,
      password:
        password ??
        (username && this.config?.username === username
          ? this.config.password
          : undefined),
      fromEmail: payload.fromEmail.trim(),
      fromName: this.normalizeOptionalString(payload.fromName),
      updatedAt: new Date().toISOString(),
    };

    this.config = normalized;
    return this.getPublicConfig();
  }

  getPublicConfig(): PublicSmtpConfig {
    if (!this.config) {
      return {
        host: null,
        port: null,
        secure: false,
        username: null,
        fromEmail: null,
        fromName: null,
        hasPassword: false,
        isConfigured: false,
        updatedAt: null,
      };
    }

    return {
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      username: this.config.username ?? null,
      fromEmail: this.config.fromEmail,
      fromName: this.config.fromName ?? null,
      hasPassword: Boolean(this.config.password),
      isConfigured: true,
      updatedAt: this.config.updatedAt,
    };
  }

  getConfigOrThrow(): SmtpConfig {
    if (!this.config) {
      throw new BadRequestException(
        'SMTP configuration is required before queueing an email job',
      );
    }

    return { ...this.config };
  }

  private normalizeOptionalString(value?: string): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }
}
