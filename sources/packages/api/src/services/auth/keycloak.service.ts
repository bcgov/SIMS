import axios from "axios";
import { ConfigService } from "../config/config.service";
import { stringify } from "qs";
import { Injectable } from "@nestjs/common";
import { IAuthConfig } from "../../types/config";
import { GetTokenResponse } from "./get-token.model";
import { RealmConfig } from "./realm-config.model";
import { OpenIdConfig } from "./openid-config.model";
import { AuthHelper } from "../../auth/auth-helper";

// Used by the method convertStringToPEM to generate the
// PEM string format required by the jwt validation frameworks.
export const PEM_BEGIN_HEADER = "-----BEGIN PUBLIC KEY-----";
export const PEM_END_HEADER = "-----END PUBLIC KEY-----";

/**
 * Manage the http requests that need be exeuted to Keycloak.
 */
@Injectable()
export class KeycloakService {
  private readonly authConfig: IAuthConfig;

  constructor(configService: ConfigService) {
    this.authConfig = configService.getConfig().auth;
  }

  /**
   * Keycloack exposes Open Id Configuration in a public URL
   * (e.g. https://dev.oidc.gov.bc.ca/auth/realms/jxoe2o46/.well-known/openid-configuration).
   * @returns Open Id Configuration.
   */
  public async getOpenIdConfig(): Promise<OpenIdConfig> {
    try {
      const response = await axios.get(this.authConfig.OpenIdConfigurationUrl);
      return response.data as OpenIdConfig;
    } catch (ex) {
      // TODO: Add a logger.
      console.log(ex);
      throw new Error("Error while loading issuer config.");
    }
  }

  /**
   * Keycloack exposes the public key in the public_key property that could be retrieve
   * accessing the issuerUrl (e.g. https://dev.oidc.gov.bc.ca/auth/realms/jxoe2o46).
   * @returns public_key retrieved from the issuer URL.
   */
  public async getRealmConfig(): Promise<RealmConfig> {
    try {
      const response = await axios.get(AuthHelper.openIdConfig.issuer);
      return {
        public_key: response.data.public_key,
        token_service: response.data["token-service"],
        account_service: response.data["account-service"],
      };
    } catch (ex) {
      // TODO: Add a logger.
      console.log(ex);
      throw new Error("Error while loading issuer config.");
    }
  }

  /**
   * Authenticate an user on Keycloak using a provided user name and password.
   * @param username User name.
   * @param password Password.
   * @param clientId Client ID.
   * @returns token
   */
  public async getToken(
    username: string,
    password: string,
    clientId: string,
  ): Promise<GetTokenResponse> {
    try {
      const data = stringify({
        grant_type: "password",
        client_id: clientId,
        username,
        password,
      });
      const response = await axios.post(
        AuthHelper.openIdConfig.token_endpoint,
        data,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        },
      );
      return response.data as GetTokenResponse;
    } catch (ex) {
      // TODO: Add a logger.
      console.log(ex);
      throw new Error("Error while request token.");
    }
  }
}
