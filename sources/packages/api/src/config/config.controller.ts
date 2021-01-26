import { Controller, Get } from '@nestjs/common';
import { GetConfig } from './models/get-config.dto';

@Controller('config')
export class ConfigController {
  @Get()
  getConfig(): GetConfig {
    return {
      auth: {
        url: process.env.KEYCLOAK_URL,
        realm: process.env.KEYCLOAK_REALM,
        clientId: process.env.KEYCLOAK_CLIENT
      },
    };
  }
}