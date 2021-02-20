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
        OpenIdConfigurationUrl: this.getOpenIdConfigurationUrl(),
      },
      e2eTest: {
        studentUser: {
          username: process.env.E2E_TEST_STUDENT_USERNAME,
          password: process.env.E2E_TEST_STUDENT_PASSWORD,
        },
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
