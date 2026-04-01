import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { LogEntry, LogLevel } from './log-entry.model';

@Injectable()
export class StructuredLoggerService {
  private readonly entries: LogEntry[] = [];
  private readonly maxEntries = 1000;

  info(event: string, payload: Record<string, unknown>): void {
    this.write('info', event, payload);
  }

  warn(event: string, payload: Record<string, unknown>): void {
    this.write('warn', event, payload);
  }

  error(event: string, payload: Record<string, unknown>): void {
    this.write('error', event, payload);
  }

  getEntries(jobId?: string): LogEntry[] {
    const entries = jobId
      ? this.entries.filter((entry) => entry.jobId === jobId)
      : this.entries;

    return [...entries].reverse().map((entry) => ({ ...entry }));
  }

  private write(
    level: LogLevel,
    event: string,
    payload: Record<string, unknown>,
  ): void {
    const entry: LogEntry = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      level,
      event,
      ...payload,
    };

    this.entries.push(entry);

    if (this.entries.length > this.maxEntries) {
      this.entries.splice(0, this.entries.length - this.maxEntries);
    }

    const serialized = JSON.stringify(entry);

    if (level === 'error') {
      console.error(serialized);
      return;
    }

    if (level === 'warn') {
      console.warn(serialized);
      return;
    }

    console.log(serialized);
  }
}
