import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  getRoot(): { message: string; health: string } {
    return {
      message: 'Async Email Control Room API is running',
      health: '/health',
    };
  }

  @Get('health')
  getHealth(): Record<string, string> {
    return {
      status: 'ok',
      service: 'async-email-control-room',
    };
  }
}
