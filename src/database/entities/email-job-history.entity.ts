import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EmailJobEntity } from './email-job.entity';
import { TenantEntity } from './tenant.entity';

@Entity({ name: 'email_job_histories' })
export class EmailJobHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 36 })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.emailJobHistories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant!: TenantEntity;

  @Column({ length: 36 })
  jobId!: string;

  @ManyToOne(() => EmailJobEntity, (job) => job.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jobId' })
  job!: EmailJobEntity;

  @Column({ length: 32 })
  status!: string;

  @Column({ length: 120 })
  event!: string;

  @Column({ default: 0 })
  attempt!: number;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'text', nullable: true })
  metadataJson!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
