import { Controller, Get, Req } from '@nestjs/common';
import { AllowAnyRole, Public } from 'nest-keycloak-connect';
import { AppService } from './app.service';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/user-info')
  @AllowAnyRole()
  keycloak(@Req() req: any): object {
    console.dir(req.headers);
    return req.user;
  }
}
