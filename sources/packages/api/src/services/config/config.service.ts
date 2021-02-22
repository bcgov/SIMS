import { Injectable } from "@nestjs/common";
import { IConfig } from "src/types/config";

@Injectable()
export class ConfigService {
  getConfig(): IConfig {
    return {
      auth: {
        url: process.env.KEYCLOAK_AUTH_URL,
        realm: process.env.KEYCLOAK_REALM,
        clientId: process.env.KEYCLOAK_CLIENT,
        openIdConfigurationUrl: this.getOpenIdConfigurationUrl(),
      },
    };
  }

  private getOpenIdConfigurationUrl(): string {
    return new URL(
      `realms/${process.env.KEYCLOAK_REALM}/.well-known/openid-configuration`,
      process.env.KEYCLOAK_AUTH_URL,
    ).href;
  }
}
