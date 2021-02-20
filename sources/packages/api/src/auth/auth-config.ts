import { KeycloakService } from "../services/auth/keycloak/keycloak.service";
import { OpenIdConfig } from "../services/auth/keycloak/openid-config.model";
import { RealmConfig } from "../services/auth/keycloak/realm-config.model";
import { convertStringToPEM } from "../utilities/certificate-utils";

/**
 * Manage the loading of Keycloak specific configs that are required to
 * be retrieve in the earliest stage of application start.
 */
export class AuthConfig {
  private static _openIdConfig: OpenIdConfig;
  public static get openIdConfig(): OpenIdConfig {
    return AuthConfig._openIdConfig;
  }

  private static _realmConfig: RealmConfig;
  public static get realmConfig(): RealmConfig {
    return AuthConfig._realmConfig;
  }

  private static _PEM_PublicKey: string;
  /**
   * Public key retrieved from Keyclock in PEM format that includes the header and footer
   * ("-----BEGIN CERTIFICATE-----" and "-----END CERTIFICATE-----").
   */
  public static get PEM_PublicKey(): string {
    return AuthConfig._PEM_PublicKey;
  }

  /**
   * Loads keycloak configs, like endpoints and public key used for token validation,
   * that needs to be available even before the application is created.
   */
  public static async load(): Promise<void> {
    AuthConfig._openIdConfig = await KeycloakService.shared.getOpenIdConfig();
    AuthConfig._realmConfig = await KeycloakService.shared.getRealmConfig();
    if (!AuthConfig._realmConfig?.public_key) {
      throw new Error("Not able to retrieve the public key.");
    }

    AuthConfig._PEM_PublicKey = convertStringToPEM(
      AuthConfig._realmConfig.public_key,
    );
  }
}
