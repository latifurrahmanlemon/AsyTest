import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RequestUser } from '../../common/auth/request-user.interface';
import { UserRole } from '../../common/auth/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listUsers(@CurrentUser() currentUser: RequestUser) {
    return this.usersService.listTenantUsers(currentUser);
  }

  @Post()
  createUser(
    @CurrentUser() currentUser: RequestUser,
    @Body() payload: CreateUserDto,
  ) {
    return this.usersService.createTenantUser(currentUser, payload);
  }

  @Patch(':userId/role')
  updateRole(
    @CurrentUser() currentUser: RequestUser,
    @Param('userId') userId: string,
    @Body() payload: UpdateUserRoleDto,
  ) {
    return this.usersService.updateTenantUserRole(currentUser, userId, payload);
  }

  @Patch(':userId/status')
  updateStatus(
    @CurrentUser() currentUser: RequestUser,
    @Param('userId') userId: string,
    @Body() payload: UpdateUserStatusDto,
  ) {
    return this.usersService.updateTenantUserStatus(currentUser, userId, payload);
  }
}
