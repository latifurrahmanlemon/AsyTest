export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  event: string;
  jobId?: string;
  [key: string]: unknown;
}
