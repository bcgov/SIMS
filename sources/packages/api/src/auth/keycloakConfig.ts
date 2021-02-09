import axios from "axios";
import { ConfigService } from "src/services/config/config.service";

// Used by the method convertStringToPEM to generate the
// PEM string format required by the jwt validation frameworks.
const PEM_BEGIN_HEADER = "-----BEGIN PUBLIC KEY-----";
const PEM_END_HEADER = "-----END PUBLIC KEY-----";

/**
 * Manage the loading of Keycloak specific configs that are required to
 * be retrieve in the earliest stage of application start.
 */
export class KeycloakConfig {
  private static _publicKey: string;
  public static get publicKey(): string {
    return KeycloakConfig._publicKey;
  }

  /**
   * Loads keycloak config and is intended to be called once before the application starts.
   * @returns loads the necessary configs that are needed in the earliest stage of application start.
   */
  public static async load(): Promise<void> {
    const publicKey = await KeycloakConfig.getPublicKeyConfig();
    if (!publicKey) {
      throw new Error("Not able to retrieve the public key.");
    }

    KeycloakConfig._publicKey = KeycloakConfig.convertStringToPEM(publicKey);
  }

  /**
   * Keycloack exposes the key in the public_key property that could be retrieve
   * accessing the issuerUrl (e.g. https://dev.oidc.gov.bc.ca/auth/realms/jxoe2o46).
   * @returns public_key retrieved from the issuer URL.
   */
  private static async getPublicKeyConfig(): Promise<string> {
    try {
      const issuerUrl = new ConfigService().getConfig().auth.issuerUrl;
      const response = await axios.get(issuerUrl);
      return response.data.public_key;
    } catch (ex) {
      // TODO: Add a logger.
      console.log(ex);
      throw new Error("Error while loading issuer config.");
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

    return `${PEM_BEGIN_HEADER}\n${publicKey}\n${PEM_END_HEADER}`;
  }
}
