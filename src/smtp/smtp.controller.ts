import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { StructuredLoggerService } from '../observability/structured-logger.service';
import { UpsertSmtpConfigDto } from './dto/upsert-smtp-config.dto';
import { PublicSmtpConfig } from './models/smtp-config.model';
import { SmtpConfigService } from './smtp-config.service';
import { SmtpMailerService } from './smtp-mailer.service';

@Controller('smtp-config')
export class SmtpController {
  constructor(
    private readonly smtpConfigService: SmtpConfigService,
    private readonly smtpMailerService: SmtpMailerService,
    private readonly logger: StructuredLoggerService,
  ) {}

  @Get()
  getConfig(): PublicSmtpConfig {
    return this.smtpConfigService.getPublicConfig();
  }

  @Put()
  updateConfig(@Body() payload: UpsertSmtpConfigDto): PublicSmtpConfig {
    const config = this.smtpConfigService.upsertConfig(payload);

    this.logger.info('smtp.config.updated', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      fromEmail: config.fromEmail,
      username: config.username,
    });

    return config;
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  async testConnection(
    @Body() payload?: UpsertSmtpConfigDto,
  ): Promise<{ ok: true; checkedAt: string }> {
    const config = payload
      ? this.smtpConfigService.upsertConfig(payload)
      : this.smtpConfigService.getPublicConfig();
    const activeConfig = this.smtpConfigService.getConfigOrThrow();

    await this.smtpMailerService.verifyConnection(activeConfig);

    this.logger.info('smtp.config.verified', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      fromEmail: config.fromEmail,
    });

    return {
      ok: true,
      checkedAt: new Date().toISOString(),
    };
  }
}
