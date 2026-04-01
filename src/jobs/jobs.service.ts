import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEmailJobDto } from './dto/create-email-job.dto';
import { EmailJob } from './models/job.model';
import { JobQueueService } from './job-queue.service';

@Injectable()
export class JobsService {
  constructor(private readonly jobQueueService: JobQueueService) {}

  createEmailJob(payload: CreateEmailJobDto): EmailJob {
    return this.jobQueueService.enqueueEmailJob(payload);
  }

  listJobs(): EmailJob[] {
    return this.jobQueueService.listJobs();
  }

  getJob(jobId: string): EmailJob {
    const job = this.jobQueueService.getJob(jobId);

    if (!job) {
      throw new NotFoundException(`Job ${jobId} was not found`);
    }

    return job;
  }

  retryJob(jobId: string): EmailJob {
    return this.jobQueueService.retryJob(jobId);
  }

  getSummary(): {
    total: number;
    queued: number;
    processing: number;
    retryScheduled: number;
    succeeded: number;
    failed: number;
  } {
    return this.jobQueueService.getSummary();
  }
}
