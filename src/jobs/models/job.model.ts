export type JobStatus =
  | 'queued'
  | 'processing'
  | 'retry_scheduled'
  | 'succeeded'
  | 'failed';

export interface JobHistoryEntry {
  timestamp: string;
  status: JobStatus;
  event: string;
  attempt: number;
  message: string;
}

export interface JobFailureDetails {
  message: string;
  name: string;
  code: string | null;
  command: string | null;
  response: string | null;
  responseCode: number | null;
  stack: string | null;
}

export interface JobSmtpSnapshot {
  host: string;
  port: number;
  secure: boolean;
  username: string | null;
  fromEmail: string;
  fromName: string | null;
}

export interface EmailJobPayload {
  to: string;
  subject: string;
  body: string;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    username?: string;
    password?: string;
    fromEmail: string;
    fromName?: string;
    updatedAt: string;
  };
  simulate?: {
    failAttempts?: number;
    processingDelayMs?: number;
  };
}

export interface EmailJob {
  id: string;
  type: 'email';
  status: JobStatus;
  payload: EmailJobPayload;
  attemptsMade: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  nextRunAt: string | null;
  lastError: string | null;
  failureDetails: JobFailureDetails | null;
  history: JobHistoryEntry[];
  result: {
    providerMessageId: string;
    accepted: string[];
    rejected: string[];
    response: string;
    smtp: JobSmtpSnapshot;
  } | null;
}
