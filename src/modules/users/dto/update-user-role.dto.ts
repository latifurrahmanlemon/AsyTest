import { IsEnum } from 'class-validator';
import { UserRole } from '../../../common/auth/role.enum';

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
