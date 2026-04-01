import { Controller, Get, Header } from '@nestjs/common';
import { uiPage } from './ui-page';

@Controller()
export class UiController {
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getDashboard(): string {
    return uiPage;
  }
}
