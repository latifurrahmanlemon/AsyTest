import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { AuditLogEntity } from './database/entities/audit-log.entity';
import { EmailJobEntity } from './database/entities/email-job.entity';
import { EmailJobHistoryEntity } from './database/entities/email-job-history.entity';
import { PasswordResetTokenEntity } from './database/entities/password-reset-token.entity';
import { SmtpConfigEntity } from './database/entities/smtp-config.entity';
import { TenantEntity } from './database/entities/tenant.entity';
import { UserEntity } from './database/entities/user.entity';
import { AuthModule } from './modules/auth/auth.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { SmtpModule } from './modules/smtp/smtp.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type:
        (process.env.DB_PROVIDER ?? 'postgres').toLowerCase() === 'mysql'
          ? 'mysql'
          : 'postgres',
      host: process.env.DB_HOST ?? '127.0.0.1',
      port: Number(
        process.env.DB_PORT ??
          ((process.env.DB_PROVIDER ?? 'postgres').toLowerCase() === 'mysql'
            ? 3306
            : 5432),
      ),
      username: process.env.DB_USERNAME ?? 'app_user',
      password: process.env.DB_PASSWORD ?? 'app_password',
      database: process.env.DB_NAME ?? 'asytest',
      entities: [
        TenantEntity,
        UserEntity,
        PasswordResetTokenEntity,
        SmtpConfigEntity,
        EmailJobEntity,
        EmailJobHistoryEntity,
        AuditLogEntity,
      ],
      synchronize: (process.env.DB_SYNCHRONIZE ?? 'true') === 'true',
      logging: (process.env.DB_LOGGING ?? 'false') === 'true',
      autoLoadEntities: false,
    }),
    HealthModule,
    forwardRef(() => ObservabilityModule),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    forwardRef(() => RbacModule),
    forwardRef(() => SmtpModule),
    forwardRef(() => JobsModule),
  ],
})
export class AppModule {}
