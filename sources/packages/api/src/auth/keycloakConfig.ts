import axios from "axios";

const PEM_BEGIN_HEADER = "-----BEGIN PUBLIC KEY-----";
const PEM_END_HEADER = "-----END PUBLIC KEY-----";

export class KeycloakConfig {
  private static _publicKey: string;
  public static get publicKey(): string {
    return KeycloakConfig._publicKey;
  }

  public static async load(): Promise<void> {
    const publicKey = await KeycloakConfig.getPublicKeyConfig();
    if (!publicKey) {
      throw new Error("Not able to retrieve the public key.");
    }

    KeycloakConfig._publicKey = KeycloakConfig.convertStringToPEM(publicKey);
  }

  private static async getPublicKeyConfig(): Promise<string> {
    const endpoint = KeycloakConfig.getKeycloakConfigEndpoint();
    const response = await axios.get(endpoint);
    return response.data.public_key;
  }

  private static getKeycloakConfigEndpoint(): string {
    return `${process.env.KEYCLOAK_AUTH_URL}realms/${process.env.KEYCLOAK_REALM}`;
  }

  private static convertStringToPEM(publicKey: string): string {
    if (!publicKey) {
      throw new Error("publicKey parameter was not provided.");
    }

    return `${PEM_BEGIN_HEADER}\n${publicKey}\n${PEM_END_HEADER}`;
  }
}
