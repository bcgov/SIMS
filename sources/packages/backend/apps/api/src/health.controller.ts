import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { Public } from "./auth/decorators/public.decorator";
@Controller("health")
export class HealthController {
  constructor(private readonly appService: AppService) {}

  /**
   * Returns a health check status.
   * @returns health check status.
   */
  @Get()
  @Public()
  getHello(): string {
    return this.appService.getHello();
  }
}
