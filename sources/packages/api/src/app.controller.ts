import { Controller, Get, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { Public } from "./auth/decorators/public.decorator";
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("/user-info")
  @ApiTags("user-info")
  keycloak(@Req() req: any): Record<string, unknown> {
    console.dir(req.headers);
    return req.user;
  }
}
