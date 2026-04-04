import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestUser } from '../../common/auth/request-user.interface';
import { UserRole } from '../../common/auth/role.enum';
import { EmailJobEntity } from '../../database/entities/email-job.entity';
import { EmailJobHistoryEntity } from '../../database/entities/email-job-history.entity';
import { AuditLogService } from '../observability/audit-log.service';
import { SmtpService } from '../smtp/smtp.service';
import { CreateEmailJobDto } from './dto/create-email-job.dto';
import { JobQueueService } from './job-queue.service';

@Injectable()
export class JobsService {
  private readonly maxAttempts = this.readPositiveInteger(
    process.env.MAX_JOB_ATTEMPTS,
    3,
  );
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
    private readonly jobQueueService: JobQueueService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async queueEmailJob(currentUser: RequestUser, payload: CreateEmailJobDto) {
    const smtpConfig = await this.smtpService.getDecryptedConfigForTenant(
      currentUser.tenantId,
    );
    const effectiveMaxAttempts = this.resolveMaxAttempts(payload);
    const effectiveRetryBaseDelayMs = this.resolveRetryBaseDelayMs(payload);
    const emailJob = this.emailJobRepository.create({
      tenantId: currentUser.tenantId,
      createdByUserId: currentUser.userId,
      toEmail: payload.to.toLowerCase().trim(),
      subject: payload.subject.trim(),
      body: payload.body,
      status: 'queued',
      attemptsMade: 0,
      maxAttempts: effectiveMaxAttempts,
      nextRunAt: null,
      lastError: null,
      providerMessageId: null,
      providerResponse: null,
      acceptedJson: null,
      rejectedJson: null,
      smtpSnapshotJson: JSON.stringify({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        username: smtpConfig.username,
        fromEmail: smtpConfig.fromEmail,
        fromName: smtpConfig.fromName,
        updatedAt: smtpConfig.updatedAt,
      }),
      metadataJson: JSON.stringify({
        simulate: payload.simulate ?? null,
        queue: {
          retryBaseDelayMs: effectiveRetryBaseDelayMs,
        },
      }),
    });
    await this.emailJobRepository.save(emailJob);

    await this.appendHistory(
      emailJob.id,
      currentUser.tenantId,
      'queued',
      'job.queued',
      0,
      `Queued email for ${emailJob.toEmail}`,
    );

    await this.auditLogService.record({
      tenantId: currentUser.tenantId,
      userId: currentUser.userId,
      level: 'info',
      event: 'job.queued',
      resourceType: 'email_job',
      resourceId: emailJob.id,
      message: `Email job ${emailJob.id} queued`,
      metadata: {
        toEmail: emailJob.toEmail,
        subject: emailJob.subject,
      },
    });

    await this.jobQueueService.enqueueEmailJob(
      {
        emailJobId: emailJob.id,
        tenantId: currentUser.tenantId,
      },
      {
        jobId: emailJob.id,
        attempts: effectiveMaxAttempts,
        backoff: {
          type: 'exponential',
          delay: effectiveRetryBaseDelayMs,
        },
        removeOnComplete: 500,
        removeOnFail: 500,
      },
    );

    return this.getJobById(currentUser, emailJob.id);
  }

  async listJobs(currentUser: RequestUser) {
    const where =
      currentUser.role === UserRole.ADMIN
        ? { tenantId: currentUser.tenantId }
        : {
            tenantId: currentUser.tenantId,
            createdByUserId: currentUser.userId,
          };

    const jobs = await this.emailJobRepository.find({
      where,
      relations: { history: true },
      order: { createdAt: 'DESC', history: { createdAt: 'ASC' } },
    });

    return jobs.map((job) => this.serializeJob(job));
  }

  async getJobById(currentUser: RequestUser, jobId: string) {
    const job = await this.emailJobRepository.findOne({
      where: { id: jobId, tenantId: currentUser.tenantId },
      relations: { history: true },
      order: { history: { createdAt: 'ASC' } },
    });

    if (!job) {
      throw new NotFoundException('Email job was not found');
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      job.createdByUserId !== currentUser.userId
    ) {
      throw new ForbiddenException('You cannot access another user’s job');
    }

    return this.serializeJob(job);
  }

  async getSummary(currentUser: RequestUser) {
    const jobs = await this.listJobs(currentUser);

    return {
      total: jobs.length,
      queued: jobs.filter((job) => job.status === 'queued').length,
      processing: jobs.filter((job) => job.status === 'processing').length,
      retryScheduled: jobs.filter((job) => job.status === 'retry_scheduled').length,
      succeeded: jobs.filter((job) => job.status === 'succeeded').length,
      failed: jobs.filter((job) => job.status === 'failed').length,
    };
  }

  async getJobLogs(currentUser: RequestUser, jobId: string) {
    await this.getJobById(currentUser, jobId);

    return this.auditLogService.listForTenant(currentUser.tenantId, {
      resourceType: 'email_job',
      resourceId: jobId,
    });
  }

  async deleteJob(currentUser: RequestUser, jobId: string): Promise<void> {
    const job = await this.emailJobRepository.findOne({
      where: { id: jobId, tenantId: currentUser.tenantId },
    });

    if (!job) {
      throw new NotFoundException('Email job was not found');
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      job.createdByUserId !== currentUser.userId
    ) {
      throw new ForbiddenException('You cannot delete another user’s job');
    }

    await this.jobQueueService.removeEmailJob(job.id).catch(() => undefined);
    await this.emailJobRepository.delete({ id: job.id, tenantId: currentUser.tenantId });

    await this.auditLogService.record({
      tenantId: currentUser.tenantId,
      userId: currentUser.userId,
      level: 'info',
      event: 'job.deleted',
      resourceType: 'email_job',
      resourceId: job.id,
      message: `Email job ${job.id} deleted`,
      metadata: {
        toEmail: job.toEmail,
        subject: job.subject,
        status: job.status,
      },
    });
  }

  private async appendHistory(
    jobId: string,
    tenantId: string,
    status: string,
    event: string,
    attempt: number,
    message: string,
  ): Promise<void> {
    const history = this.emailJobHistoryRepository.create({
      tenantId,
      jobId,
      status,
      event,
      attempt,
      message,
      metadataJson: null,
    });

    await this.emailJobHistoryRepository.save(history);
  }

  private serializeJob(job: EmailJobEntity) {
    return {
      id: job.id,
      tenantId: job.tenantId,
      createdByUserId: job.createdByUserId,
      toEmail: job.toEmail,
      subject: job.subject,
      body: job.body,
      status: job.status,
      attemptsMade: job.attemptsMade,
      maxAttempts: job.maxAttempts,
      nextRunAt: job.nextRunAt?.toISOString() ?? null,
      lastError: job.lastError,
      result: {
        providerMessageId: job.providerMessageId,
        providerResponse: job.providerResponse,
        accepted: job.acceptedJson ? JSON.parse(job.acceptedJson) : [],
        rejected: job.rejectedJson ? JSON.parse(job.rejectedJson) : [],
        smtpSnapshot: JSON.parse(job.smtpSnapshotJson),
      },
      metadata: job.metadataJson ? JSON.parse(job.metadataJson) : null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      history: (job.history ?? []).map((item) => ({
        id: item.id,
        status: item.status,
        event: item.event,
        attempt: item.attempt,
        message: item.message,
        metadata: item.metadataJson ? JSON.parse(item.metadataJson) : null,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }

  private resolveMaxAttempts(payload: CreateEmailJobDto): number {
    return payload.simulate?.maxAttempts ?? this.maxAttempts;
  }

  private resolveRetryBaseDelayMs(payload: CreateEmailJobDto): number {
    return payload.simulate?.retryBaseDelayMs ?? this.retryBaseDelayMs;
  }

  private readPositiveInteger(rawValue: string | undefined, fallback: number): number {
    const parsed = Number(rawValue);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }
}
