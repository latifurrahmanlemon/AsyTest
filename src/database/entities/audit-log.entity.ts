import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TenantEntity } from './tenant.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'audit_logs' })
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 36, nullable: true })
  tenantId!: string | null;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.auditLogs, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'tenantId' })
  tenant!: TenantEntity | null;

  @Column({ length: 36, nullable: true })
  userId!: string | null;

  @ManyToOne(() => UserEntity, (user) => user.auditLogs, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity | null;

  @Column({ length: 16 })
  level!: string;

  @Column({ length: 120 })
  event!: string;

  @Column({ length: 80, nullable: true })
  resourceType!: string | null;

  @Column({ length: 120, nullable: true })
  resourceId!: string | null;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'text', nullable: true })
  metadataJson!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
