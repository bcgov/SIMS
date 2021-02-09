import { Controller, Get } from "@nestjs/common";
import { Public } from "src/auth/decorators/public.decorator";
import { GetConfig } from "./models/get-config.dto";

@Controller("config")
export class ConfigController {
  @Public()
  @Get()
  getConfig(): GetConfig {
    return {
      auth: {
        url: process.env.KEYCLOAK_AUTH_URL,
        realm: process.env.KEYCLOAK_REALM,
        clientId: process.env.KEYCLOAK_CLIENT,
      },
    };
  }
}
