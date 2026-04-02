import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantEntity } from './tenant.entity';
import { UserEntity } from './user.entity';
import { EmailJobHistoryEntity } from './email-job-history.entity';

@Entity({ name: 'email_jobs' })
export class EmailJobEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 36 })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.emailJobs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant!: TenantEntity;

  @Column({ length: 36 })
  createdByUserId!: string;

  @ManyToOne(() => UserEntity, (user) => user.emailJobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy!: UserEntity;

  @Column({ length: 190 })
  toEmail!: string;

  @Column({ length: 200 })
  subject!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ length: 32, default: 'queued' })
  status!: string;

  @Column({ default: 0 })
  attemptsMade!: number;

  @Column({ default: 3 })
  maxAttempts!: number;

  @Column({ type: 'timestamp', nullable: true })
  nextRunAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  lastError!: string | null;

  @Column({ length: 255, nullable: true })
  providerMessageId!: string | null;

  @Column({ type: 'text', nullable: true })
  providerResponse!: string | null;

  @Column({ type: 'text', nullable: true })
  acceptedJson!: string | null;

  @Column({ type: 'text', nullable: true })
  rejectedJson!: string | null;

  @Column({ type: 'text' })
  smtpSnapshotJson!: string;

  @Column({ type: 'text', nullable: true })
  metadataJson!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => EmailJobHistoryEntity, (history) => history.job)
  history!: EmailJobHistoryEntity[];
}
