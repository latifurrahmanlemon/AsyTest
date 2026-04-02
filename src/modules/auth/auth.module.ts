import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CryptoService } from '../../common/services/crypto.service';
import { PasswordResetTokenEntity } from '../../database/entities/password-reset-token.entity';
import { TenantEntity } from '../../database/entities/tenant.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { ObservabilityModule } from '../observability/observability.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      TenantEntity,
      UserEntity,
      PasswordResetTokenEntity,
    ]),
    forwardRef(() => ObservabilityModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, CryptoService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
