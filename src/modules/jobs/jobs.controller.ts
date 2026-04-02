import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RequestUser } from '../../common/auth/request-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateEmailJobDto } from './dto/create-email-job.dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('email')
  @HttpCode(HttpStatus.ACCEPTED)
  queueEmailJob(
    @CurrentUser() currentUser: RequestUser,
    @Body() payload: CreateEmailJobDto,
  ) {
    return this.jobsService.queueEmailJob(currentUser, payload);
  }

  @Get('summary')
  getSummary(@CurrentUser() currentUser: RequestUser) {
    return this.jobsService.getSummary(currentUser);
  }

  @Get()
  listJobs(@CurrentUser() currentUser: RequestUser) {
    return this.jobsService.listJobs(currentUser);
  }

  @Get(':jobId')
  getJobById(
    @CurrentUser() currentUser: RequestUser,
    @Param('jobId') jobId: string,
  ) {
    return this.jobsService.getJobById(currentUser, jobId);
  }
}
