import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { TenantEntity } from './tenant.entity';

@Entity({ name: 'smtp_configs' })
@Unique('uq_smtp_configs_tenant_id', ['tenantId'])
export class SmtpConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 36 })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.smtpConfigs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant!: TenantEntity;

  @Column({ length: 200 })
  host!: string;

  @Column()
  port!: number;

  @Column({ default: false })
  secure!: boolean;

  @Column({ type: 'varchar', length: 190, nullable: true })
  username!: string | null;

  @Column({ type: 'text', nullable: true })
  passwordEncrypted!: string | null;

  @Column({ length: 190 })
  fromEmail!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  fromName!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
