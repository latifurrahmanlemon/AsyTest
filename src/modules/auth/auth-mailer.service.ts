import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class AuthMailerService {
  async sendSignupOtp(params: { email: string; fullName: string; otp: string }): Promise<void> {
    const transporter = this.createTransport();

    if (!transporter) {
      if ((process.env.NODE_ENV ?? 'development') === 'production') {
        throw new InternalServerErrorException(
          'OTP delivery is not configured. Set APP_MAIL_HOST and related mail variables.',
        );
      }

      return;
    }

    const fromEmail = process.env.APP_MAIL_FROM_EMAIL?.trim();
    const fromName = process.env.APP_MAIL_FROM_NAME?.trim() || 'AsyTest';

    await transporter.sendMail({
      from: fromEmail ? `"${fromName}" <${fromEmail}>` : fromName,
      to: params.email,
      subject: 'Verify your AsyTest account',
      text: [
        `Hello ${params.fullName},`,
        '',
        `Your AsyTest verification code is ${params.otp}.`,
        'This code expires in 10 minutes.',
      ].join('\n'),
    });
  }

  private createTransport(): nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null {
    const host = process.env.APP_MAIL_HOST?.trim();
    const port = Number(process.env.APP_MAIL_PORT ?? 0);

    if (!host || !port) {
      return null;
    }

    const secure = (process.env.APP_MAIL_SECURE ?? 'false') === 'true';
    const username = process.env.APP_MAIL_USERNAME?.trim();
    const password = process.env.APP_MAIL_PASSWORD?.trim();

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: username
        ? {
            user: username,
            pass: password || undefined,
          }
        : undefined,
    });
  }
}
