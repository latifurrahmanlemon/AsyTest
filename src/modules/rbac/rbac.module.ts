import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';
import { RbacController } from './rbac.controller';

@Module({
  imports: [AuthModule],
  controllers: [RbacController],
  providers: [JwtAuthGuard],
})
export class RbacModule {}
