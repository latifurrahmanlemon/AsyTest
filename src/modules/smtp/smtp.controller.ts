import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { RequestUser } from '../../common/auth/request-user.interface';
import { UserRole } from '../../common/auth/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UpsertSmtpConfigDto } from './dto/upsert-smtp-config.dto';
import { SmtpService } from './smtp.service';

@Controller('smtp-config')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SmtpController {
  constructor(private readonly smtpService: SmtpService) {}

  @Get()
  getConfig(@CurrentUser() currentUser: RequestUser) {
    return this.smtpService.getPublicConfig(currentUser);
  }

  @Put()
  @Roles(UserRole.ADMIN)
  updateConfig(
    @CurrentUser() currentUser: RequestUser,
    @Body() payload: UpsertSmtpConfigDto,
  ) {
    return this.smtpService.upsertConfig(currentUser, payload);
  }

  @Post('test')
  @Roles(UserRole.ADMIN)
  testCurrentConfig(@CurrentUser() currentUser: RequestUser) {
    return this.smtpService.testCurrentConfig(currentUser);
  }
}
