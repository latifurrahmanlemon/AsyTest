import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { JobsOptions, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { EmailQueuePayload } from './jobs.types';

@Injectable()
export class JobQueueService implements OnModuleDestroy {
  private readonly queueName = process.env.REDIS_QUEUE_NAME ?? 'email-jobs';
  private readonly connection = new IORedis({
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB ?? 0),
    maxRetriesPerRequest: null,
  });
  private readonly queue = new Queue<EmailQueuePayload>(this.queueName, {
    connection: this.connection,
  });

  async enqueueEmailJob(payload: EmailQueuePayload, options: JobsOptions): Promise<void> {
    await this.queue.add('send-email', payload, options);
  }

  getQueueName(): string {
    return this.queueName;
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
    await this.connection.quit();
  }
}
