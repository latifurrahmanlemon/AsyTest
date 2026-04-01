import { Injectable } from '@nestjs/common';
import { SmtpMailerService } from '../smtp/smtp-mailer.service';
import { EmailJob } from './models/job.model';

@Injectable()
export class EmailJobProcessor {
  constructor(private readonly smtpMailerService: SmtpMailerService) {}

  async handle(job: EmailJob): Promise<{
    providerMessageId: string;
    accepted: string[];
    rejected: string[];
    response: string;
  }> {
    const processingDelayMs = job.payload.simulate?.processingDelayMs ?? 0;
    const failAttempts = job.payload.simulate?.failAttempts ?? 0;

    if (processingDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, processingDelayMs));
    }

    if (job.attemptsMade <= failAttempts) {
      throw new Error(
        `Simulated email provider failure on attempt ${job.attemptsMade}`,
      );
    }

    const result = await this.smtpMailerService.sendMail(job.payload.smtp, {
      to: job.payload.to,
      subject: job.payload.subject,
      body: job.payload.body,
    });

    return {
      providerMessageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
      response: result.response,
    };
  }
}
