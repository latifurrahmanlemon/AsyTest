import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateEmailJobDto } from './dto/create-email-job.dto';
import { EmailJobProcessor } from './email-job.processor';
import { StructuredLoggerService } from '../observability/structured-logger.service';
import {
  EmailJob,
  JobHistoryEntry,
  JobStatus,
} from './models/job.model';
import { SmtpConfigService } from '../smtp/smtp-config.service';

@Injectable()
export class JobQueueService implements OnModuleDestroy {
  private readonly jobs = new Map<string, EmailJob>();
  private readonly queue: string[] = [];
  private readonly retryTimers = new Map<string, NodeJS.Timeout>();
  private activeWorkers = 0;

  private readonly concurrency = this.readPositiveInteger(
    process.env.WORKER_CONCURRENCY,
    1,
  );
  private readonly maxAttempts = this.readPositiveInteger(
    process.env.MAX_JOB_ATTEMPTS,
    3,
  );
  private readonly retryBaseDelayMs = this.readPositiveInteger(
    process.env.RETRY_BASE_DELAY_MS,
    1000,
  );

  constructor(
    private readonly emailJobProcessor: EmailJobProcessor,
    private readonly logger: StructuredLoggerService,
    private readonly smtpConfigService: SmtpConfigService,
  ) {}

  enqueueEmailJob(payload: CreateEmailJobDto): EmailJob {
    const timestamp = new Date().toISOString();
    const smtpConfig = this.smtpConfigService.getConfigOrThrow();
    const job: EmailJob = {
      id: randomUUID(),
      type: 'email',
      status: 'queued',
      payload: {
        to: payload.to,
        subject: payload.subject,
        body: payload.body,
        smtp: smtpConfig,
        simulate: payload.simulate,
      },
      attemptsMade: 0,
      maxAttempts: this.maxAttempts,
      createdAt: timestamp,
      updatedAt: timestamp,
      nextRunAt: null,
      lastError: null,
      history: [],
      result: null,
    };

    this.appendHistory(job, {
      timestamp,
      status: 'queued',
      event: 'job.queued',
      attempt: 0,
      message: `Queued email for ${job.payload.to}`,
    });

    this.jobs.set(job.id, job);
    this.queue.push(job.id);

    this.logger.info('job.queued', {
      jobId: job.id,
      jobType: job.type,
      queueSize: this.queue.length,
      recipient: job.payload.to,
      maxAttempts: job.maxAttempts,
    });

    void this.pumpQueue();
    return this.cloneJob(job);
  }

  listJobs(): EmailJob[] {
    return Array.from(this.jobs.values())
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((job) => this.cloneJob(job));
  }

  getJob(jobId: string): EmailJob | undefined {
    const job = this.jobs.get(jobId);
    return job ? this.cloneJob(job) : undefined;
  }

  getSummary(): {
    total: number;
    queued: number;
    processing: number;
    retryScheduled: number;
    succeeded: number;
    failed: number;
  } {
    const jobs = Array.from(this.jobs.values());

    return {
      total: jobs.length,
      queued: jobs.filter((job) => job.status === 'queued').length,
      processing: jobs.filter((job) => job.status === 'processing').length,
      retryScheduled: jobs.filter((job) => job.status === 'retry_scheduled')
        .length,
      succeeded: jobs.filter((job) => job.status === 'succeeded').length,
      failed: jobs.filter((job) => job.status === 'failed').length,
    };
  }

  onModuleDestroy(): void {
    for (const timer of this.retryTimers.values()) {
      clearTimeout(timer);
    }

    this.retryTimers.clear();
  }

  private async pumpQueue(): Promise<void> {
    while (this.activeWorkers < this.concurrency && this.queue.length > 0) {
      const jobId = this.queue.shift();

      if (!jobId) {
        return;
      }

      const job = this.jobs.get(jobId);

      if (!job || job.status !== 'queued') {
        continue;
      }

      this.activeWorkers += 1;
      void this.processJob(job).finally(() => {
        this.activeWorkers -= 1;
        void this.pumpQueue();
      });
    }
  }

  private async processJob(job: EmailJob): Promise<void> {
    job.attemptsMade += 1;
    this.updateJob(job, 'processing', {
      nextRunAt: null,
      lastError: null,
    });
    this.appendHistory(job, {
      timestamp: new Date().toISOString(),
      status: 'processing',
      event: 'job.processing.started',
      attempt: job.attemptsMade,
      message: `Started processing attempt ${job.attemptsMade}`,
    });

    this.logger.info('job.processing.started', {
      jobId: job.id,
      jobType: job.type,
      attempt: job.attemptsMade,
      maxAttempts: job.maxAttempts,
      recipient: job.payload.to,
    });

    try {
      const result = await this.emailJobProcessor.handle(this.cloneJob(job));

      this.updateJob(job, 'succeeded', {
        result: {
          ...result,
          smtp: this.getSmtpSnapshot(job),
        },
        nextRunAt: null,
        lastError: null,
      });
      this.appendHistory(job, {
        timestamp: new Date().toISOString(),
        status: 'succeeded',
        event: 'job.processing.succeeded',
        attempt: job.attemptsMade,
        message: `Email delivered with provider message id ${result.providerMessageId}`,
      });

      this.logger.info('job.processing.succeeded', {
        jobId: job.id,
        jobType: job.type,
        attempt: job.attemptsMade,
        recipient: job.payload.to,
        providerMessageId: result.providerMessageId,
      });
    } catch (error) {
      const message = this.getErrorMessage(error);
      job.lastError = message;

      if (job.attemptsMade < job.maxAttempts) {
        const delayMs = this.calculateBackoffDelay(job.attemptsMade);
        const nextRunAt = new Date(Date.now() + delayMs).toISOString();

        this.updateJob(job, 'retry_scheduled', {
          nextRunAt,
          lastError: message,
        });
        this.appendHistory(job, {
          timestamp: new Date().toISOString(),
          status: 'retry_scheduled',
          event: 'job.processing.retry_scheduled',
          attempt: job.attemptsMade,
          message: `Attempt ${job.attemptsMade} failed. Retry ${job.attemptsMade + 1} scheduled in ${delayMs}ms`,
        });

        this.logger.warn('job.processing.retry_scheduled', {
          jobId: job.id,
          jobType: job.type,
          attempt: job.attemptsMade,
          nextAttempt: job.attemptsMade + 1,
          maxAttempts: job.maxAttempts,
          retryDelayMs: delayMs,
          nextRunAt,
          error: message,
        });

        const timer = setTimeout(() => {
          this.retryTimers.delete(job.id);

          const currentJob = this.jobs.get(job.id);
          if (!currentJob || currentJob.status !== 'retry_scheduled') {
            return;
          }

          this.updateJob(currentJob, 'queued', {
            nextRunAt: null,
          });
          this.appendHistory(currentJob, {
            timestamp: new Date().toISOString(),
            status: 'queued',
            event: 'job.requeued',
            attempt: currentJob.attemptsMade,
            message: `Job moved back to queue for attempt ${currentJob.attemptsMade + 1}`,
          });
          this.queue.push(currentJob.id);
          void this.pumpQueue();
        }, delayMs);

        this.retryTimers.set(job.id, timer);
        return;
      }

      this.updateJob(job, 'failed', {
        nextRunAt: null,
        lastError: message,
      });
      this.appendHistory(job, {
        timestamp: new Date().toISOString(),
        status: 'failed',
        event: 'job.processing.failed',
        attempt: job.attemptsMade,
        message: `Job failed permanently after ${job.attemptsMade} attempts`,
      });

      this.logger.error('job.processing.failed', {
        jobId: job.id,
        jobType: job.type,
        attempt: job.attemptsMade,
        maxAttempts: job.maxAttempts,
        recipient: job.payload.to,
        error: message,
      });
    }
  }

  private updateJob(
    job: EmailJob,
    status: JobStatus,
    overrides: Partial<EmailJob>,
  ): void {
    Object.assign(job, overrides);
    job.status = status;
    job.updatedAt = new Date().toISOString();
    this.jobs.set(job.id, job);
  }

  private calculateBackoffDelay(attempt: number): number {
    return this.retryBaseDelayMs * 2 ** (attempt - 1);
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown job processing error';
  }

  private readPositiveInteger(
    rawValue: string | undefined,
    fallback: number,
  ): number {
    const parsed = Number(rawValue);

    if (!Number.isInteger(parsed) || parsed < 1) {
      return fallback;
    }

    return parsed;
  }

  private appendHistory(job: EmailJob, entry: JobHistoryEntry): void {
    job.history = [...job.history, entry];
    this.jobs.set(job.id, job);
  }

  private getSmtpSnapshot(job: EmailJob): {
    host: string;
    port: number;
    secure: boolean;
    username: string | null;
    fromEmail: string;
    fromName: string | null;
  } {
    return {
      host: job.payload.smtp.host,
      port: job.payload.smtp.port,
      secure: job.payload.smtp.secure,
      username: job.payload.smtp.username ?? null,
      fromEmail: job.payload.smtp.fromEmail,
      fromName: job.payload.smtp.fromName ?? null,
    };
  }

  private cloneJob(job: EmailJob): EmailJob {
    return {
      ...job,
      payload: {
        ...job.payload,
        smtp: {
          ...job.payload.smtp,
          password: undefined,
        },
        simulate: job.payload.simulate
          ? { ...job.payload.simulate }
          : undefined,
      },
      history: job.history.map((entry) => ({ ...entry })),
      result: job.result ? { ...job.result } : null,
    };
  }
}
