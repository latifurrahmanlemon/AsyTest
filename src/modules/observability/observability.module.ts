import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';
import { AuthModule } from '../auth/auth.module';
import { AuditLogService } from './audit-log.service';
import { LogsController } from './logs.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLogEntity]),
    forwardRef(() => AuthModule),
  ],
  controllers: [LogsController],
  providers: [AuditLogService, JwtAuthGuard, RolesGuard],
  exports: [AuditLogService],
})
export class ObservabilityModule {}
