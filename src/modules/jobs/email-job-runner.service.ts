import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { EmailJobEntity } from '../../database/entities/email-job.entity';
import { EmailJobHistoryEntity } from '../../database/entities/email-job-history.entity';
import { AuditLogService } from '../observability/audit-log.service';
import { SmtpMailerService } from '../smtp/smtp-mailer.service';
import { SmtpService } from '../smtp/smtp.service';
import { EmailQueuePayload, EmailJobStatus } from './jobs.types';

@Injectable()
export class EmailJobRunnerService {
  private readonly logger = new Logger(EmailJobRunnerService.name);
  private readonly retryBaseDelayMs = this.readPositiveInteger(
    process.env.RETRY_BASE_DELAY_MS,
    1000,
  );

  constructor(
    @InjectRepository(EmailJobEntity)
    private readonly emailJobRepository: Repository<EmailJobEntity>,
    @InjectRepository(EmailJobHistoryEntity)
    private readonly emailJobHistoryRepository: Repository<EmailJobHistoryEntity>,
    private readonly smtpService: SmtpService,
    private readonly smtpMailerService: SmtpMailerService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async process(
    queueJob: Job<EmailQueuePayload>,
  ): Promise<{ providerMessageId: string }> {
    const emailJob = await this.emailJobRepository.findOne({
      where: { id: queueJob.data.emailJobId, tenantId: queueJob.data.tenantId },
    });

    if (!emailJob) {
      throw new Error(`Email job ${queueJob.data.emailJobId} was not found`);
    }

    const attempt = queueJob.attemptsMade + 1;
    await this.updateJob(emailJob, 'processing', {
      attemptsMade: attempt,
      nextRunAt: null,
      lastError: null,
    });
    await this.appendHistory(emailJob, 'processing', 'job.processing.started', attempt, `Started processing attempt ${attempt}`);

    try {
      await this.applySimulationIfNeeded(emailJob, attempt);

      const smtpConfig = await this.smtpService.getDecryptedConfigForTenant(
        emailJob.tenantId,
      );
      const result = await this.smtpMailerService.sendMail(smtpConfig, {
        to: emailJob.toEmail,
        subject: emailJob.subject,
        body: emailJob.body,
      });

      await this.updateJob(emailJob, 'succeeded', {
        attemptsMade: attempt,
        providerMessageId: result.messageId,
        providerResponse: result.response,
        acceptedJson: JSON.stringify(result.accepted),
        rejectedJson: JSON.stringify(result.rejected),
        nextRunAt: null,
        lastError: null,
      });
      await this.appendHistory(
        emailJob,
        'succeeded',
        'job.processing.succeeded',
        attempt,
        `Email sent successfully with provider message id ${result.messageId}`,
        {
          accepted: result.accepted,
          rejected: result.rejected,
        },
      );
      await this.auditLogService.record({
        tenantId: emailJob.tenantId,
        userId: emailJob.createdByUserId,
        level: 'info',
        event: 'job.processing.succeeded',
        resourceType: 'email_job',
        resourceId: emailJob.id,
        message: `Email job ${emailJob.id} succeeded`,
        metadata: {
          attempt,
          providerMessageId: result.messageId,
        },
      });

      return {
        providerMessageId: result.messageId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown job processing error';
      const retryBaseDelayMs = this.resolveRetryBaseDelayMs(emailJob);
      const nextRunAt =
        attempt < emailJob.maxAttempts
          ? new Date(Date.now() + retryBaseDelayMs * 2 ** (attempt - 1))
          : null;

      await this.updateJob(emailJob, attempt < emailJob.maxAttempts ? 'retry_scheduled' : 'failed', {
        attemptsMade: attempt,
        nextRunAt,
        lastError: errorMessage,
      });

      await this.appendHistory(
        emailJob,
        attempt < emailJob.maxAttempts ? 'retry_scheduled' : 'failed',
        attempt < emailJob.maxAttempts
          ? 'job.processing.retry_scheduled'
          : 'job.processing.failed',
        attempt,
        attempt < emailJob.maxAttempts
          ? `Attempt ${attempt} failed. Next retry scheduled at ${nextRunAt?.toISOString()}`
          : `Job failed permanently after ${attempt} attempts`,
        {
          error: errorMessage,
          retryBaseDelayMs,
        },
      );

      await this.auditLogService.record({
        tenantId: emailJob.tenantId,
        userId: emailJob.createdByUserId,
        level: attempt < emailJob.maxAttempts ? 'warn' : 'error',
        event:
          attempt < emailJob.maxAttempts
            ? 'job.processing.retry_scheduled'
            : 'job.processing.failed',
        resourceType: 'email_job',
        resourceId: emailJob.id,
        message:
          attempt < emailJob.maxAttempts
            ? `Email job ${emailJob.id} scheduled for retry`
            : `Email job ${emailJob.id} failed permanently`,
        metadata: {
          attempt,
          error: errorMessage,
          nextRunAt: nextRunAt?.toISOString() ?? null,
          retryBaseDelayMs,
        },
      });

      this.logger.warn(
        `Email job ${emailJob.id} failed on attempt ${attempt}: ${errorMessage}`,
      );
      throw error;
    }
  }

  private async updateJob(
    job: EmailJobEntity,
    status: EmailJobStatus,
    overrides: Partial<EmailJobEntity>,
  ): Promise<void> {
    Object.assign(job, overrides);
    job.status = status;
    await this.emailJobRepository.save(job);
  }

  private async appendHistory(
    job: EmailJobEntity,
    status: EmailJobStatus,
    event: string,
    attempt: number,
    message: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const entry = this.emailJobHistoryRepository.create({
      tenantId: job.tenantId,
      jobId: job.id,
      status,
      event,
      attempt,
      message,
      metadataJson: metadata ? JSON.stringify(metadata) : null,
    });

    await this.emailJobHistoryRepository.save(entry);
  }

  private async applySimulationIfNeeded(
    job: EmailJobEntity,
    attempt: number,
  ): Promise<void> {
    const metadata = job.metadataJson
      ? (JSON.parse(job.metadataJson) as {
          simulate?: {
            failAttempts?: number;
            processingDelayMs?: number;
            maxAttempts?: number;
            retryBaseDelayMs?: number;
          } | null;
          queue?: {
            retryBaseDelayMs?: number;
          };
        })
      : undefined;
    const failAttempts = metadata?.simulate?.failAttempts ?? 0;
    const processingDelayMs = metadata?.simulate?.processingDelayMs ?? 0;

    if (processingDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, processingDelayMs));
    }

    if (attempt <= failAttempts) {
      throw new Error(`Simulated email provider failure on attempt ${attempt}`);
    }
  }

  private resolveRetryBaseDelayMs(job: EmailJobEntity): number {
    if (!job.metadataJson) {
      return this.retryBaseDelayMs;
    }

    const metadata = JSON.parse(job.metadataJson) as {
      queue?: { retryBaseDelayMs?: number };
    };

    return metadata.queue?.retryBaseDelayMs ?? this.retryBaseDelayMs;
  }

  private readPositiveInteger(rawValue: string | undefined, fallback: number): number {
    const parsed = Number(rawValue);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }
}
