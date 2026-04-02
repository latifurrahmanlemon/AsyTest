import { Controller, Get, UseGuards } from '@nestjs/common';
import { ROLE_PERMISSIONS } from '../../common/auth/role-permissions';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('rbac')
@UseGuards(JwtAuthGuard)
export class RbacController {
  @Get('permissions-matrix')
  getPermissionsMatrix(): typeof ROLE_PERMISSIONS {
    return ROLE_PERMISSIONS;
  }
}
