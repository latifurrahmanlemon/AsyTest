import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';

interface RecordAuditLogInput {
  tenantId?: string | null;
  userId?: string | null;
  level: 'info' | 'warn' | 'error';
  event: string;
  resourceType?: string | null;
  resourceId?: string | null;
  message: string;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  async record(input: RecordAuditLogInput): Promise<void> {
    const entry = this.auditLogRepository.create({
      tenantId: input.tenantId ?? null,
      userId: input.userId ?? null,
      level: input.level,
      event: input.event,
      resourceType: input.resourceType ?? null,
      resourceId: input.resourceId ?? null,
      message: input.message,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
    });

    await this.auditLogRepository.save(entry);

    const serialized = JSON.stringify({
      id: entry.id,
      timestamp: entry.createdAt?.toISOString?.() ?? new Date().toISOString(),
      level: entry.level,
      event: entry.event,
      tenantId: entry.tenantId,
      userId: entry.userId,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      message: entry.message,
      metadata: input.metadata ?? null,
    });

    if (entry.level === 'error') {
      console.error(serialized);
      return;
    }

    if (entry.level === 'warn') {
      console.warn(serialized);
      return;
    }

    console.log(serialized);
  }

  async listForTenant(
    tenantId: string,
    options?: {
      resourceType?: string;
      resourceId?: string;
      userId?: string;
    },
  ): Promise<
    Array<{
      id: string;
      level: string;
      event: string;
      resourceType: string | null;
      resourceId: string | null;
      message: string;
      metadata: Record<string, unknown> | null;
      createdAt: string;
    }>
  > {
    const query = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .where('auditLog.tenantId = :tenantId', { tenantId })
      .orderBy('auditLog.createdAt', 'DESC')
      .take(100);

    if (options?.resourceType) {
      query.andWhere('auditLog.resourceType = :resourceType', {
        resourceType: options.resourceType,
      });
    }

    if (options?.resourceId) {
      query.andWhere('auditLog.resourceId = :resourceId', {
        resourceId: options.resourceId,
      });
    }

    if (options?.userId) {
      query.andWhere('auditLog.userId = :userId', {
        userId: options.userId,
      });
    }

    const items = await query.getMany();

    return items.map((item) => ({
      id: item.id,
      level: item.level,
      event: item.event,
      resourceType: item.resourceType,
      resourceId: item.resourceId,
      message: item.message,
      metadata: item.metadataJson
        ? (JSON.parse(item.metadataJson) as Record<string, unknown>)
        : null,
      createdAt: item.createdAt.toISOString(),
    }));
  }
}
