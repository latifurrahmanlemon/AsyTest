import { Controller, Get, Query } from '@nestjs/common';
import { LogEntry } from './log-entry.model';
import { StructuredLoggerService } from './structured-logger.service';

@Controller('logs')
export class LogsController {
  constructor(private readonly logger: StructuredLoggerService) {}

  @Get()
  listLogs(@Query('jobId') jobId?: string): LogEntry[] {
    return this.logger.getEntries(jobId);
  }
}
