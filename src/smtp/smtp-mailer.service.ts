import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { SmtpConfig } from './models/smtp-config.model';

interface SendMailInput {
  to: string;
  subject: string;
  body: string;
}

export interface EmailDeliveryFailureDetails {
  message: string;
  name: string;
  code: string | null;
  command: string | null;
  response: string | null;
  responseCode: number | null;
  stack: string | null;
}

export class EmailDeliveryError extends Error {
  constructor(public readonly details: EmailDeliveryFailureDetails) {
    super(details.message);
    this.name = 'EmailDeliveryError';
  }
}

@Injectable()
export class SmtpMailerService {
  async verifyConnection(config: SmtpConfig): Promise<void> {
    const transporter = nodemailer.createTransport(this.buildTransport(config));
    await transporter.verify();
  }

  async sendMail(
    config: SmtpConfig,
    payload: SendMailInput,
  ): Promise<{
    messageId: string;
    accepted: string[];
    rejected: string[];
    response: string;
  }> {
    const transporter = nodemailer.createTransport(this.buildTransport(config));

    let info: nodemailer.SentMessageInfo;

    try {
      info = await transporter.sendMail({
        from: config.fromName
          ? `"${config.fromName}" <${config.fromEmail}>`
          : config.fromEmail,
        to: payload.to,
        subject: payload.subject,
        text: payload.body,
      });
    } catch (error) {
      throw new EmailDeliveryError(this.extractFailureDetails(error));
    }

    return {
      messageId: info.messageId,
      accepted: info.accepted.map(String),
      rejected: info.rejected.map(String),
      response: info.response,
    };
  }

  private buildTransport(config: SmtpConfig): SMTPTransport.Options {
    return {
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.username
        ? {
            user: config.username,
            pass: config.password,
          }
        : undefined,
    };
  }

  private extractFailureDetails(error: unknown): EmailDeliveryFailureDetails {
    if (error instanceof Error) {
      const smtpError = error as Error & {
        code?: string;
        command?: string;
        response?: string;
        responseCode?: number;
      };

      return {
        message: error.message,
        name: error.name,
        code: smtpError.code ?? null,
        command: smtpError.command ?? null,
        response: smtpError.response ?? null,
        responseCode: smtpError.responseCode ?? null,
        stack: error.stack ?? null,
      };
    }

    return {
      message: 'Unknown SMTP delivery error',
      name: 'UnknownError',
      code: null,
      command: null,
      response: null,
      responseCode: null,
      stack: null,
    };
  }
}
