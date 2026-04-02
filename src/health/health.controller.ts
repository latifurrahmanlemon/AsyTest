import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  getRoot(): Record<string, string> {
    return {
      name: 'async-email-control-room',
      status: 'ok',
      mode: 'api',
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
