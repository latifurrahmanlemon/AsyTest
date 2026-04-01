import { Module } from '@nestjs/common';
import { ObservabilityModule } from '../observability/observability.module';
import { SmtpController } from './smtp.controller';
import { SmtpConfigService } from './smtp-config.service';
import { SmtpMailerService } from './smtp-mailer.service';

@Module({
  imports: [ObservabilityModule],
  controllers: [SmtpController],
  providers: [SmtpConfigService, SmtpMailerService],
  exports: [SmtpConfigService, SmtpMailerService],
})
export class SmtpModule {}
