import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequestUser } from '../../common/auth/request-user.interface';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResendSignupOtpDto } from './dto/resend-signup-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';
import { VerifySignupOtpDto } from './dto/verify-signup-otp.dto';
import { AuthService } from './auth.service';
import { AuthResponse, SignupResponse } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() payload: SignupDto): Promise<SignupResponse> {
    return this.authService.signup(payload);
  }

  @Post('verify-signup-otp')
  verifySignupOtp(
    @Body() payload: VerifySignupOtpDto,
  ): Promise<{ message: string }> {
    return this.authService.verifySignupOtp(payload);
  }

  @Post('resend-signup-otp')
  resendSignupOtp(
    @Body() payload: ResendSignupOtpDto,
  ): Promise<{ message: string; previewOtp?: string }> {
    return this.authService.resendSignupOtp(payload);
  }

  @Post('login')
  login(@Body() payload: LoginDto): Promise<AuthResponse> {
    return this.authService.login(payload);
  }

  @Post('forgot-password')
  forgotPassword(
    @Body() payload: ForgotPasswordDto,
  ): Promise<{ message: string; previewToken?: string }> {
    return this.authService.forgotPassword(payload);
  }

  @Post('reset-password')
  resetPassword(
    @Body() payload: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(payload);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() currentUser: RequestUser): Promise<AuthResponse['user']> {
    return this.authService.getProfile(currentUser);
  }
}
