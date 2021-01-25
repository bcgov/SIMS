import { Controller, Get } from '@nestjs/common';
import { GetConfig } from './models/get-config.dto';

@Controller('config')
export class ConfigController {
  @Get()
  getConfig(): GetConfig {
    return {
      keyCloak: {
        url: process.env.KEYCLOAK_URL,
        realm: process.env.KEYCLOAK_REALM,
        client: process.env.KEYCLOAK_CLIENT
      },
    };
  }
}