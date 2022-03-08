import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../auth/decorators/public.decorator";
import { ConfigService } from "../../services/config/config.service";
import { IConfig } from "./models/get-config.dto";

@Controller("config")
@ApiTags("config")
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
        clientIds: config.auth.clientIds,
        externalSiteMinderLogoutUrl: config.auth.externalSiteMinderLogoutUrl,
      },
    };
  }
}
