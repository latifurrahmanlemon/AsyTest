import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../../common/auth/role.enum';
import { AuditLogEntity } from './audit-log.entity';
import { EmailJobEntity } from './email-job.entity';
import { PasswordResetTokenEntity } from './password-reset-token.entity';
import { TenantEntity } from './tenant.entity';

@Entity({ name: 'users' })
@Unique('uq_users_email', ['email'])
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 36 })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: TenantEntity;

  @Column({ length: 120 })
  fullName!: string;

  @Column({ length: 190 })
  email!: string;

  @Column({ length: 120 })
  passwordHash!: string;

  @Column({ length: 20, default: UserRole.USER })
  role!: UserRole;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => PasswordResetTokenEntity, (token) => token.user)
  passwordResetTokens!: PasswordResetTokenEntity[];

  @OneToMany(() => EmailJobEntity, (job) => job.createdBy)
  emailJobs!: EmailJobEntity[];

  @OneToMany(() => AuditLogEntity, (log) => log.user)
  auditLogs!: AuditLogEntity[];
}
