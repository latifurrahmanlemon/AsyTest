import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmailJobEntity } from '../src/database/entities/email-job.entity';
import { EmailJobHistoryEntity } from '../src/database/entities/email-job-history.entity';
import { UserRole } from '../src/common/auth/role.enum';
import { JobsService } from '../src/modules/jobs/jobs.service';
import { JobQueueService } from '../src/modules/jobs/job-queue.service';
import { AuditLogService } from '../src/modules/observability/audit-log.service';
import { SmtpService } from '../src/modules/smtp/smtp.service';

describe('JobsService', () => {
  let moduleRef: TestingModule;
  let service: JobsService;

  const emailJobRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };
  const emailJobHistoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };
  const smtpService = {
    getDecryptedConfigForTenant: jest.fn(),
  };
  const jobQueueService = {
    enqueueEmailJob: jest.fn(),
  };
  const auditLogService = {
    record: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    moduleRef = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getRepositoryToken(EmailJobEntity),
          useValue: emailJobRepository,
        },
        {
          provide: getRepositoryToken(EmailJobHistoryEntity),
          useValue: emailJobHistoryRepository,
        },
        {
          provide: SmtpService,
          useValue: smtpService,
        },
        {
          provide: JobQueueService,
          useValue: jobQueueService,
        },
        {
          provide: AuditLogService,
          useValue: auditLogService,
        },
      ],
    }).compile();

    service = moduleRef.get(JobsService);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('queues a tenant-scoped job and pushes it into BullMQ', async () => {
    smtpService.getDecryptedConfigForTenant.mockResolvedValue({
      id: 'smtp-1',
      tenantId: 'tenant-1',
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      username: 'mailer',
      password: 'secret',
      fromEmail: 'noreply@example.com',
      fromName: 'Mailer',
      updatedAt: '2026-04-02T00:00:00.000Z',
    });
    emailJobRepository.create.mockImplementation((payload: object) => ({
      id: 'job-1',
      createdAt: new Date('2026-04-02T00:00:00.000Z'),
      updatedAt: new Date('2026-04-02T00:00:00.000Z'),
      history: [],
      ...payload,
    }));
    emailJobRepository.save.mockImplementation(async (entity: object) => entity);
    emailJobHistoryRepository.create.mockImplementation((payload: object) => payload);
    emailJobHistoryRepository.save.mockResolvedValue(undefined);
    emailJobRepository.findOne.mockResolvedValue({
      id: 'job-1',
      tenantId: 'tenant-1',
      createdByUserId: 'user-1',
      toEmail: 'recipient@example.com',
      subject: 'Hello',
      body: 'Body',
      status: 'queued',
      attemptsMade: 0,
      maxAttempts: 3,
      nextRunAt: null,
      lastError: null,
      providerMessageId: null,
      providerResponse: null,
      acceptedJson: null,
      rejectedJson: null,
      smtpSnapshotJson: JSON.stringify({
        host: 'smtp.example.com',
      }),
      metadataJson: null,
      createdAt: new Date('2026-04-02T00:00:00.000Z'),
      updatedAt: new Date('2026-04-02T00:00:00.000Z'),
      history: [],
    });

    const result = await service.queueEmailJob(
      {
        userId: 'user-1',
        tenantId: 'tenant-1',
        email: 'member@example.com',
        role: UserRole.USER,
      },
      {
        to: 'recipient@example.com',
        subject: 'Hello',
        body: 'Body',
      },
    );

    expect(jobQueueService.enqueueEmailJob).toHaveBeenCalledWith(
      {
        emailJobId: 'job-1',
        tenantId: 'tenant-1',
      },
      expect.objectContaining({
        attempts: 3,
        jobId: 'job-1',
      }),
    );
    expect(result.id).toBe('job-1');
    expect(result.tenantId).toBe('tenant-1');
  });
});
