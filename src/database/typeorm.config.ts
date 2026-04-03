import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { AuditLogEntity } from './entities/audit-log.entity';
import { EmailJobEntity } from './entities/email-job.entity';
import { EmailJobHistoryEntity } from './entities/email-job-history.entity';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';
import { SmtpConfigEntity } from './entities/smtp-config.entity';
import { TenantEntity } from './entities/tenant.entity';
import { UserEntity } from './entities/user.entity';

export const databaseEntities = [
  TenantEntity,
  UserEntity,
  PasswordResetTokenEntity,
  SmtpConfigEntity,
  EmailJobEntity,
  EmailJobHistoryEntity,
  AuditLogEntity,
];

export function buildTypeOrmOptions(): TypeOrmModuleOptions {
  const provider = (process.env.DB_PROVIDER ?? 'postgres').toLowerCase();
  const type = provider === 'mysql' ? 'mysql' : 'postgres';

  return {
    type,
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? (type === 'mysql' ? 3306 : 5432)),
    username: process.env.DB_USERNAME ?? 'app_user',
    password: process.env.DB_PASSWORD ?? 'app_password',
    database: process.env.DB_NAME ?? 'asytest',
    entities: databaseEntities,
    synchronize: (process.env.DB_SYNCHRONIZE ?? 'false') === 'true',
    logging: (process.env.DB_LOGGING ?? 'false') === 'true',
    autoLoadEntities: false,
  };
}

export function buildDataSourceOptions(): DataSourceOptions {
  return buildTypeOrmOptions() as DataSourceOptions;
}
