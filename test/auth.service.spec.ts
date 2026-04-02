import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/modules/auth/auth.service';
import { PasswordResetTokenEntity } from '../src/database/entities/password-reset-token.entity';
import { TenantEntity } from '../src/database/entities/tenant.entity';
import { UserEntity } from '../src/database/entities/user.entity';
import { AuditLogService } from '../src/modules/observability/audit-log.service';
import { CryptoService } from '../src/common/services/crypto.service';
import { UserRole } from '../src/common/auth/role.enum';

describe('AuthService', () => {
  let moduleRef: TestingModule;
  let service: AuthService;

  const tenantRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const userRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const resetTokenRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const auditLogService = {
    record: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        CryptoService,
        {
          provide: getRepositoryToken(TenantEntity),
          useValue: tenantRepository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(PasswordResetTokenEntity),
          useValue: resetTokenRepository,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: AuditLogService,
          useValue: auditLogService,
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('creates a tenant and initial admin during signup', async () => {
    tenantRepository.findOne.mockResolvedValue(null);
    userRepository.findOne.mockResolvedValue(null);
    tenantRepository.create.mockImplementation((payload: object) => ({
      id: 'tenant-1',
      ...payload,
    }));
    tenantRepository.save.mockImplementation(async (entity: object) => entity);
    userRepository.create.mockImplementation((payload: object) => ({
      id: 'user-1',
      ...payload,
    }));
    userRepository.save.mockImplementation(async (entity: object) => entity);
    jwtService.signAsync.mockResolvedValue('signed-token');

    const result = await service.signup({
      tenantName: 'Acme',
      fullName: 'Alice Admin',
      email: 'alice@example.com',
      password: 'very-secret',
    });

    expect(result.accessToken).toBe('signed-token');
    expect(result.user.role).toBe(UserRole.ADMIN);
    expect(result.user.tenantName).toBe('Acme');
    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'auth.signup.completed',
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    );
  });

  it('returns a preview reset token outside production mode', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    userRepository.findOne.mockResolvedValue({
      id: 'user-2',
      tenantId: 'tenant-2',
      email: 'member@example.com',
      isActive: true,
      tenant: { id: 'tenant-2', name: 'Beta' },
    });
    resetTokenRepository.create.mockImplementation((payload: object) => payload);
    resetTokenRepository.save.mockResolvedValue(undefined);

    const result = await service.forgotPassword({
      email: 'member@example.com',
    });

    expect(result.message).toContain('If a matching account exists');
    expect(result.previewToken).toBeDefined();
    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'auth.password_reset.requested',
        tenantId: 'tenant-2',
      }),
    );

    process.env.NODE_ENV = previousNodeEnv;
  });
});
