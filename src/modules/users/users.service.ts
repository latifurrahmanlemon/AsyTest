import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { RequestUser } from '../../common/auth/request-user.interface';
import { UserRole } from '../../common/auth/role.enum';
import { UserEntity } from '../../database/entities/user.entity';
import { AuditLogService } from '../observability/audit-log.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createTenantUser(
    currentUser: RequestUser,
    payload: CreateUserDto,
  ): Promise<{
    id: string;
    tenantId: string;
    fullName: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  }> {
    const normalizedEmail = payload.email.toLowerCase().trim();
    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new BadRequestException('A user with this email already exists');
    }

    const user = this.userRepository.create({
      tenantId: currentUser.tenantId,
      fullName: payload.fullName.trim(),
      email: normalizedEmail,
      passwordHash: await hash(payload.password, 10),
      role:
        payload.role && payload.role === UserRole.ADMIN
          ? UserRole.ADMIN
          : UserRole.USER,
      isActive: true,
    });
    await this.userRepository.save(user);

    await this.auditLogService.record({
      tenantId: currentUser.tenantId,
      userId: currentUser.userId,
      level: 'info',
      event: 'users.created',
      resourceType: 'user',
      resourceId: user.id,
      message: `Admin created user ${user.email}`,
      metadata: {
        role: user.role,
      },
    });

    return this.toPublicUser(user);
  }

  async listTenantUsers(currentUser: RequestUser): Promise<
    Array<{
      id: string;
      tenantId: string;
      fullName: string;
      email: string;
      role: UserRole;
      isActive: boolean;
    }>
  > {
    const users = await this.userRepository.find({
      where: { tenantId: currentUser.tenantId },
      order: { createdAt: 'ASC' },
    });

    return users.map((user) => this.toPublicUser(user));
  }

  async updateTenantUserRole(
    currentUser: RequestUser,
    targetUserId: string,
    payload: UpdateUserRoleDto,
  ): Promise<{
    id: string;
    tenantId: string;
    fullName: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  }> {
    const user = await this.getTenantUserOrThrow(currentUser.tenantId, targetUserId);

    if (
      user.role === UserRole.ADMIN &&
      payload.role !== UserRole.ADMIN &&
      (await this.countActiveAdmins(currentUser.tenantId)) <= 1
    ) {
      throw new BadRequestException('A tenant must always have at least one active admin');
    }

    user.role = payload.role;
    await this.userRepository.save(user);

    await this.auditLogService.record({
      tenantId: currentUser.tenantId,
      userId: currentUser.userId,
      level: 'warn',
      event: 'users.role_updated',
      resourceType: 'user',
      resourceId: user.id,
      message: `User ${user.email} role changed to ${user.role}`,
    });

    return this.toPublicUser(user);
  }

  async updateTenantUserStatus(
    currentUser: RequestUser,
    targetUserId: string,
    payload: UpdateUserStatusDto,
  ): Promise<{
    id: string;
    tenantId: string;
    fullName: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  }> {
    const user = await this.getTenantUserOrThrow(currentUser.tenantId, targetUserId);

    if (
      user.role === UserRole.ADMIN &&
      user.isActive &&
      !payload.isActive &&
      (await this.countActiveAdmins(currentUser.tenantId)) <= 1
    ) {
      throw new BadRequestException('A tenant must always have at least one active admin');
    }

    user.isActive = payload.isActive;
    await this.userRepository.save(user);

    await this.auditLogService.record({
      tenantId: currentUser.tenantId,
      userId: currentUser.userId,
      level: 'warn',
      event: 'users.status_updated',
      resourceType: 'user',
      resourceId: user.id,
      message: `User ${user.email} active state changed to ${user.isActive}`,
    });

    return this.toPublicUser(user);
  }

  async getTenantUserOrThrow(tenantId: string, userId: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User was not found in this tenant');
    }

    return user;
  }

  private async countActiveAdmins(tenantId: string): Promise<number> {
    return this.userRepository.count({
      where: {
        tenantId,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });
  }

  private toPublicUser(user: UserEntity): {
    id: string;
    tenantId: string;
    fullName: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  } {
    return {
      id: user.id,
      tenantId: user.tenantId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
