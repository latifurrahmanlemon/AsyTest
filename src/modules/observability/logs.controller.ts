import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RequestUser } from '../../common/auth/request-user.interface';
import { UserRole } from '../../common/auth/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogService } from './audit-log.service';

@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogsController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  listTenantLogs(
    @CurrentUser() currentUser: RequestUser,
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.auditLogService.listForTenant(currentUser.tenantId, {
      resourceType,
      resourceId,
      userId,
    });
  }
}
