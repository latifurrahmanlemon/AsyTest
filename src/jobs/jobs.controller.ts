import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CreateEmailJobDto } from './dto/create-email-job.dto';
import { EmailJob } from './models/job.model';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('email')
  @HttpCode(HttpStatus.ACCEPTED)
  createEmailJob(@Body() payload: CreateEmailJobDto): EmailJob {
    return this.jobsService.createEmailJob(payload);
  }

  @Post(':jobId/retry')
  @HttpCode(HttpStatus.ACCEPTED)
  retryJob(@Param('jobId') jobId: string): EmailJob {
    return this.jobsService.retryJob(jobId);
  }

  @Get('summary')
  getSummary(): {
    total: number;
    queued: number;
    processing: number;
    retryScheduled: number;
    succeeded: number;
    failed: number;
  } {
    return this.jobsService.getSummary();
  }

  @Get()
  listJobs(): EmailJob[] {
    return this.jobsService.listJobs();
  }

  @Get(':jobId')
  getJob(@Param('jobId') jobId: string): EmailJob {
    return this.jobsService.getJob(jobId);
  }
}
