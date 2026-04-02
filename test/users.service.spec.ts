import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { UserEntity } from '../src/database/entities/user.entity';
import { UserRole } from '../src/common/auth/role.enum';
import { UsersService } from '../src/modules/users/users.service';
import { AuditLogService } from '../src/modules/observability/audit-log.service';

describe('UsersService', () => {
  let moduleRef: TestingModule;
  let service: UsersService;

  const userRepository = {
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };
  const auditLogService = {
    record: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: userRepository,
        },
        {
          provide: AuditLogService,
          useValue: auditLogService,
        },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('prevents disabling the last active admin in a tenant', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 'admin-1',
      tenantId: 'tenant-1',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      isActive: true,
    });
    userRepository.count.mockResolvedValue(1);

    await expect(
      service.updateTenantUserStatus(
        {
          userId: 'admin-1',
          tenantId: 'tenant-1',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        'admin-1',
        { isActive: false },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
