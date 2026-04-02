import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AuditLogEntity } from './audit-log.entity';
import { EmailJobEntity } from './email-job.entity';
import { EmailJobHistoryEntity } from './email-job-history.entity';
import { SmtpConfigEntity } from './smtp-config.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'tenants' })
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({ length: 140, unique: true })
  slug!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => UserEntity, (user) => user.tenant)
  users!: UserEntity[];

  @OneToMany(() => SmtpConfigEntity, (config) => config.tenant)
  smtpConfigs!: SmtpConfigEntity[];

  @OneToMany(() => EmailJobEntity, (job) => job.tenant)
  emailJobs!: EmailJobEntity[];

  @OneToMany(() => EmailJobHistoryEntity, (history) => history.tenant)
  emailJobHistories!: EmailJobHistoryEntity[];

  @OneToMany(() => AuditLogEntity, (log) => log.tenant)
  auditLogs!: AuditLogEntity[];
}
