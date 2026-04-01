import { Module } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { StructuredLoggerService } from './structured-logger.service';

@Module({
  controllers: [LogsController],
  providers: [StructuredLoggerService],
  exports: [StructuredLoggerService],
})
export class ObservabilityModule {}
