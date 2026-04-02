import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CryptoService } from '../../common/services/crypto.service';
import { SmtpConfigEntity } from '../../database/entities/smtp-config.entity';
import { AuthModule } from '../auth/auth.module';
import { ObservabilityModule } from '../observability/observability.module';
import { SmtpController } from './smtp.controller';
import { SmtpMailerService } from './smtp-mailer.service';
import { SmtpService } from './smtp.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SmtpConfigEntity]),
    forwardRef(() => AuthModule),
    forwardRef(() => ObservabilityModule),
  ],
  controllers: [SmtpController],
  providers: [
    SmtpService,
    SmtpMailerService,
    CryptoService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [SmtpService, SmtpMailerService],
})
export class SmtpModule {}
