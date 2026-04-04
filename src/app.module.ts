import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { buildTypeOrmOptions } from './database/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { SmtpModule } from './modules/smtp/smtp.module';
import { UsersModule } from './modules/users/users.module';
import { UiModule } from './ui/ui.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(buildTypeOrmOptions()),
    HealthModule,
    forwardRef(() => ObservabilityModule),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    forwardRef(() => RbacModule),
    forwardRef(() => SmtpModule),
    forwardRef(() => JobsModule),
    UiModule,
  ],
})
export class AppModule {}
