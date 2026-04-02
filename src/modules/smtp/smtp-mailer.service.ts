import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { DecryptedSmtpConfig } from './smtp.types';

@Injectable()
export class SmtpMailerService {
  async verifyConnection(config: DecryptedSmtpConfig): Promise<void> {
    const transporter = nodemailer.createTransport(this.buildTransport(config));
    await transporter.verify();
  }

  async sendMail(
    config: DecryptedSmtpConfig,
    payload: {
      to: string;
      subject: string;
      body: string;
    },
  ): Promise<{
    messageId: string;
    accepted: string[];
    rejected: string[];
    response: string;
  }> {
    const transporter = nodemailer.createTransport(this.buildTransport(config));
    const info = await transporter.sendMail({
      from: config.fromName
        ? `"${config.fromName}" <${config.fromEmail}>`
        : config.fromEmail,
      to: payload.to,
      subject: payload.subject,
      text: payload.body,
    });

    return {
      messageId: info.messageId,
      accepted: info.accepted.map(String),
      rejected: info.rejected.map(String),
      response: info.response,
    };
  }

  private buildTransport(config: DecryptedSmtpConfig): SMTPTransport.Options {
    return {
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.username
        ? {
            user: config.username,
            pass: config.password ?? undefined,
          }
        : undefined,
    };
  }
}
