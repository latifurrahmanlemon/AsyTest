import { Test, TestingModule } from '@nestjs/testing';
import { StructuredLoggerService } from '../src/observability/structured-logger.service';
import { EmailJobProcessor } from '../src/jobs/email-job.processor';
import { JobQueueService } from '../src/jobs/job-queue.service';
import { SmtpConfigService } from '../src/smtp/smtp-config.service';

const flushPromises = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('JobQueueService', () => {
  let moduleRef: TestingModule;
  let service: JobQueueService;
  let processor: { handle: jest.Mock };

  beforeEach(async () => {
    jest.useFakeTimers();
    process.env.MAX_JOB_ATTEMPTS = '3';
    process.env.RETRY_BASE_DELAY_MS = '1000';
    process.env.WORKER_CONCURRENCY = '1';

    processor = {
      handle: jest.fn(),
    };

    moduleRef = await Test.createTestingModule({
      providers: [
        JobQueueService,
        {
          provide: EmailJobProcessor,
          useValue: processor,
        },
        {
          provide: StructuredLoggerService,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: SmtpConfigService,
          useValue: {
            getConfigOrThrow: jest.fn().mockReturnValue({
              host: 'smtp.example.com',
              port: 587,
              secure: false,
              username: 'user',
              password: 'secret',
              fromEmail: 'noreply@example.com',
              fromName: 'Mailer',
              updatedAt: new Date().toISOString(),
            }),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(JobQueueService);
  });

  afterEach(async () => {
    service.onModuleDestroy();
    await moduleRef.close();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('marks a job as succeeded when processing completes on the first attempt', async () => {
    processor.handle.mockResolvedValue({
      providerMessageId: 'msg-1',
      accepted: ['success@example.com'],
      rejected: [],
      response: '250 queued',
    });

    const job = service.enqueueEmailJob({
      to: 'success@example.com',
      subject: 'Hello',
      body: 'Test message',
      simulate: {
        processingDelayMs: 0,
      },
    });

    await flushPromises();

    const storedJob = service.getJob(job.id);

    expect(storedJob).toBeDefined();
    expect(storedJob?.status).toBe('succeeded');
    expect(storedJob?.attemptsMade).toBe(1);
    expect(storedJob?.result?.providerMessageId).toBe('msg-1');
    expect(storedJob?.history).toHaveLength(3);
  });

  it('retries with exponential backoff and eventually succeeds', async () => {
    processor.handle
      .mockRejectedValueOnce(new Error('Attempt 1 failed'))
      .mockRejectedValueOnce(new Error('Attempt 2 failed'))
      .mockResolvedValueOnce({
        providerMessageId: 'msg-2',
        accepted: ['retry@example.com'],
        rejected: [],
        response: '250 queued',
      });

    const job = service.enqueueEmailJob({
      to: 'retry@example.com',
      subject: 'Retry me',
      body: 'Testing retries',
      simulate: {
        failAttempts: 2,
        processingDelayMs: 0,
      },
    });

    await flushPromises();
    expect(service.getJob(job.id)?.status).toBe('retry_scheduled');
    expect(service.getJob(job.id)?.attemptsMade).toBe(1);

    await jest.advanceTimersByTimeAsync(1000);
    await flushPromises();
    expect(service.getJob(job.id)?.status).toBe('retry_scheduled');
    expect(service.getJob(job.id)?.attemptsMade).toBe(2);

    await jest.advanceTimersByTimeAsync(2000);
    await flushPromises();
    expect(service.getJob(job.id)?.status).toBe('succeeded');
    expect(service.getJob(job.id)?.attemptsMade).toBe(3);
  });

  it('marks a job as failed after the maximum number of attempts', async () => {
    processor.handle.mockRejectedValue(new Error('provider failed'));

    const job = service.enqueueEmailJob({
      to: 'failure@example.com',
      subject: 'Fail me',
      body: 'Testing failure',
      simulate: {
        failAttempts: 10,
        processingDelayMs: 0,
      },
    });

    await flushPromises();
    await jest.advanceTimersByTimeAsync(1000);
    await flushPromises();
    await jest.advanceTimersByTimeAsync(2000);
    await flushPromises();

    const storedJob = service.getJob(job.id);

    expect(storedJob?.status).toBe('failed');
    expect(storedJob?.attemptsMade).toBe(3);
    expect(storedJob?.lastError).toContain('provider failed');
  });
});
