import { Controller, Get } from "@nestjs/common";
import { Public } from "src/auth/decorators/public.decorator";
import { ConfigService } from "src/services/config/config.service";
import { IConfig } from "./models/get-config.dto";

@Controller("config")
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Public()
  @Get()
  getConfig(): IConfig {
    const config = this.configService.getConfig();
    return {
      auth: {
        url: config.auth.url,
        realm: config.auth.realm,
        clientId: config.auth.clientId,
      },
    };
  }
}
