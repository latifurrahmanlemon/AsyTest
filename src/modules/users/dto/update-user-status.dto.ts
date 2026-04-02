import { IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserStatusDto {
  @Type(() => Boolean)
  @IsBoolean()
  isActive!: boolean;
}
