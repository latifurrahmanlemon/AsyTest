import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signup: jest.fn().mockResolvedValue({
              accessToken: 'token',
              user: {
                id: 'user-1',
                tenantId: 'tenant-1',
                tenantName: 'Acme',
                fullName: 'Alice Admin',
                email: 'alice@example.com',
                role: 'admin',
              },
            }),
            login: jest.fn().mockResolvedValue({
              accessToken: 'token',
              user: {
                id: 'user-1',
                tenantId: 'tenant-1',
                tenantName: 'Acme',
                fullName: 'Alice Admin',
                email: 'alice@example.com',
                role: 'admin',
              },
            }),
            forgotPassword: jest.fn().mockResolvedValue({
              message: 'If a matching account exists, a password reset token has been generated',
            }),
            resetPassword: jest.fn().mockResolvedValue({
              message: 'Password updated successfully',
            }),
            getProfile: jest.fn(),
            validateAccessToken: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('handles signup requests', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        tenantName: 'Acme',
        fullName: 'Alice Admin',
        email: 'alice@example.com',
        password: 'very-secret',
      })
      .expect(201);

    expect(response.body.accessToken).toBe('token');
    expect(response.body.user.tenantName).toBe('Acme');
  });
});
