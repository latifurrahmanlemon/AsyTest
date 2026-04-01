import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { SmtpMailerService } from '../src/smtp/smtp-mailer.service';

describe('JobsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SmtpMailerService)
      .useValue({
        verifyConnection: jest.fn().mockResolvedValue(undefined),
        sendMail: jest.fn().mockResolvedValue({
          messageId: 'e2e-message-id',
          accepted: ['candidate@example.com'],
          rejected: [],
          response: '250 accepted',
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the dashboard UI', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);

    expect(response.text).toContain('Async Email Control Room');
    expect(response.text).toContain('SMTP Configuration');
  });

  it('creates a new email job', async () => {
    await request(app.getHttpServer())
      .put('/smtp-config')
      .send({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        username: 'mailer',
        password: 'secret',
        fromEmail: 'noreply@example.com',
        fromName: 'Mailer',
      })
      .expect(200);

    const response = await request(app.getHttpServer())
      .post('/jobs/email')
      .send({
        to: 'candidate@example.com',
        subject: 'Async test',
        body: 'Hello from the queue',
        simulate: {
          processingDelayMs: 0,
        },
      })
      .expect(202);

    expect(response.body.id).toBeDefined();
    expect(response.body.type).toBe('email');
    expect(response.body.maxAttempts).toBe(3);
    expect(response.body.payload.smtp.password).toBeUndefined();
  });

  it('rejects invalid email payloads', async () => {
    await request(app.getHttpServer())
      .post('/jobs/email')
      .send({
        to: 'not-an-email',
        subject: '',
        body: 'invalid payload',
      })
      .expect(400);
  });
});
