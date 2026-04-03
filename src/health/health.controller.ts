import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  getHealth(): Record<string, string> {
    return {
      status: 'ok',
      service: 'async-email-control-room',
    };
  }
}
