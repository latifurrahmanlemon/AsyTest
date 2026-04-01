import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertSmtpConfigDto {
  @IsString()
  @IsNotEmpty()
  host!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  port!: number;

  @Type(() => Boolean)
  @IsBoolean()
  secure!: boolean;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsEmail()
  fromEmail!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fromName?: string;
}
