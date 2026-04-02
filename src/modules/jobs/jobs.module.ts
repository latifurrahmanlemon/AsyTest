import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EmailJobEntity } from '../../database/entities/email-job.entity';
import { EmailJobHistoryEntity } from '../../database/entities/email-job-history.entity';
import { AuthModule } from '../auth/auth.module';
import { ObservabilityModule } from '../observability/observability.module';
import { SmtpModule } from '../smtp/smtp.module';
import { EmailJobRunnerService } from './email-job-runner.service';
import { EmailJobWorkerService } from './email-job-worker.service';
import { JobQueueService } from './job-queue.service';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailJobEntity, EmailJobHistoryEntity]),
    forwardRef(() => AuthModule),
    forwardRef(() => ObservabilityModule),
    forwardRef(() => SmtpModule),
  ],
  controllers: [JobsController],
  providers: [
    JobQueueService,
    EmailJobRunnerService,
    EmailJobWorkerService,
    JobsService,
    JwtAuthGuard,
  ],
  exports: [JobsService],
})
export class JobsModule {}
