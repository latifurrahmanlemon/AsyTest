import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { ObservabilityModule } from './observability/observability.module';
import { SmtpModule } from './smtp/smtp.module';
import { UiModule } from './ui/ui.module';

@Module({
  imports: [HealthModule, ObservabilityModule, SmtpModule, JobsModule, UiModule],
})
export class AppModule {}
