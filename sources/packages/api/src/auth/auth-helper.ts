import { ConfigService } from "../services/config/config.service";
import { KeycloakService } from "../services/auth/keycloak.service";
import { OpenIdConfig } from "../services/auth/openid-config.model";
import { RealmConfig } from "../services/auth/realm-config.model";

// Used by the method convertStringToPEM to generate the
// PEM string format required by the jwt validation frameworks.
export const PEM_BEGIN_HEADER = "-----BEGIN PUBLIC KEY-----\n";
export const PEM_END_HEADER = "\n-----END PUBLIC KEY-----";

/**
 * Manage the loading of Keycloak specific configs that are required to
 * be retrieve in the earliest stage of application start.
 */
export class AuthHelper {
  private static _keycloakService: KeycloakService;

  static initialize() {
    console.log("AuthHelper initialize");
    AuthHelper._keycloakService = new KeycloakService(new ConfigService());
  }

  private static _realmConfig: RealmConfig;
  public static get realmConfig(): RealmConfig {
    return AuthHelper._realmConfig;
  }

  private static _openIdConfig: OpenIdConfig;
  public static get openIdConfig(): OpenIdConfig {
    return AuthHelper._openIdConfig;
  }

  /**
   * Loads keycloak config and is intended to be called once before the application starts.
   * @returns loads the necessary configs that are needed in the earliest stage of application start.
   */
  public static async load(): Promise<void> {
    AuthHelper._openIdConfig = await AuthHelper._keycloakService.getOpenIdConfig();
    AuthHelper._realmConfig = await AuthHelper._keycloakService.getRealmConfig();
    if (!AuthHelper._realmConfig?.public_key) {
      throw new Error("Not able to retrieve the public key.");
    }

    AuthHelper._realmConfig.public_key = AuthHelper.convertStringToPEM(
      AuthHelper._realmConfig.public_key,
    );
  }

  public static async getAccessToken(
    username: string,
    password: string,
    clientId: string,
  ): Promise<string> {
    try {
      const getTokenResponse = await AuthHelper._keycloakService.getToken(
        username,
        password,
        clientId,
      );
      return getTokenResponse.access_token;
    } catch (ex) {
      // TODO: Add a logger.
      console.log(ex);
      throw new Error("Error while request token.");
    }
  }

  /**
   * Convert a string to a PEM format.
   * PEM (originally “Privacy Enhanced Mail”) is the most common format for X.509 certificates,
   * CSRs, and cryptographic keys. A PEM file is a text file containing one or more items in
   * Base64 ASCII encoding, each with plain-text headers and footers
   * (e.g. -----BEGIN CERTIFICATE----- and -----END CERTIFICATE-----).
   * source: https://www.ssl.com/guide/pem-der-crt-and-cer-x-509-encodings-and-conversions/#:~:text=PEM%20(originally%20%E2%80%9CPrivacy%20Enhanced%20Mail,%2D%2D%2D%2D%2D%20).
   * @param publicKey
   * @returns string to pem
   */
  private static convertStringToPEM(publicKey: string): string {
    if (!publicKey) {
      throw new Error("publicKey parameter was not provided.");
    }

    return `${PEM_BEGIN_HEADER}${publicKey}${PEM_END_HEADER}`;
  }
}
AuthHelper.initialize();
