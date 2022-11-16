import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../auth/decorators/public.decorator";
import { ConfigService } from "@sims/utilities/config";
import BaseController from "../BaseController";
import { IConfig } from "./models/get-config.dto";

@Controller("config")
@ApiTags("config")
export class ConfigController extends BaseController {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  @Public()
  @Get()
  getConfig(): IConfig {
    const authConfig = this.configService.auth;
    return {
      auth: {
        url: authConfig.url,
        realm: authConfig.realm,
        clientIds: authConfig.clientIds,
        externalSiteMinderLogoutUrl: authConfig.externalSiteMinderLogoutUrl,
      },
    };
  }
}
