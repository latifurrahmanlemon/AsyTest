import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { AuditLogService } from '../observability/audit-log.service';
import { JobQueueService } from './job-queue.service';
import { EmailJobRunnerService } from './email-job-runner.service';
import { EmailQueuePayload } from './jobs.types';

@Injectable()
export class EmailJobWorkerService implements OnModuleInit, OnModuleDestroy {
  private worker: Worker<EmailQueuePayload> | null = null;
  private readonly connection = new IORedis({
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB ?? 0),
    maxRetriesPerRequest: null,
  });

  constructor(
    private readonly jobQueueService: JobQueueService,
    private readonly emailJobRunnerService: EmailJobRunnerService,
    private readonly auditLogService: AuditLogService,
  ) {}

  onModuleInit(): void {
    const enabled = (process.env.QUEUE_WORKER_ENABLED ?? 'true') !== 'false';
    if (!enabled) {
      return;
    }

    this.worker = new Worker<EmailQueuePayload>(
      this.jobQueueService.getQueueName(),
      async (job) => this.emailJobRunnerService.process(job),
      {
        connection: this.connection,
        concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5),
      },
    );

    this.worker.on('failed', async (job, error) => {
      if (!job) {
        return;
      }

      await this.auditLogService.record({
        tenantId: job.data.tenantId,
        level: 'error',
        event: 'queue.worker.failed',
        resourceType: 'email_job',
        resourceId: job.data.emailJobId,
        message: `Worker reported failure for email job ${job.data.emailJobId}`,
        metadata: {
          queueAttemptsMade: job.attemptsMade,
          error: error.message,
        },
      });
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
    await this.connection.quit();
  }
}
