import { Controller, Get, Header } from '@nestjs/common';
import { uiPage } from './ui-page';

@Controller()
export class UiController {
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getUi(): string {
    return uiPage;
  }
}
