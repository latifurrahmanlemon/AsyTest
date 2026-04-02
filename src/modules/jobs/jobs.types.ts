export type EmailJobStatus =
  | 'queued'
  | 'processing'
  | 'retry_scheduled'
  | 'succeeded'
  | 'failed';

export interface EmailQueuePayload {
  emailJobId: string;
  tenantId: string;
}
