import { Module } from '@nestjs/common';
import { ObservabilityModule } from '../observability/observability.module';
import { SmtpModule } from '../smtp/smtp.module';
import { EmailJobProcessor } from './email-job.processor';
import { JobQueueService } from './job-queue.service';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [ObservabilityModule, SmtpModule],
  controllers: [JobsController],
  providers: [EmailJobProcessor, JobQueueService, JobsService],
  exports: [JobQueueService],
})
export class JobsModule {}
