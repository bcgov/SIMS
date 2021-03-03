import axios from "axios";
import { Injectable } from "@nestjs/common";
import { stringify } from "qs";
import { ConfigService } from "../../config/config.service";
import { IAuthConfig } from "../../../types/config";
import { TokenResponse } from "./token-response.model";
import { RealmConfig } from "./realm-config.model";
import { OpenIdConfig } from "./openid-config.model";
import { KeycloakConfig } from "../../../auth/keycloakConfig";
import { Loggable, LoggerEnable } from "../../../common";
import { LoggerService } from "../../../logger/logger.service";

/**
 * Manage the HTTP requests that need to be exeuted to Keycloak.
 * This service allows a singleton access to the KeycloakService
 * with the intention to be used on areas of the application that
 * are not part of the dependency injection framework.
 * All others areas should prefer to have it inject to make it easier
 * to create mockups for unit tests.
 */
@Injectable()
@LoggerEnable()
export class KeycloakService implements Loggable {
  private readonly authConfig: IAuthConfig;

  constructor(configService: ConfigService) {
    this.authConfig = configService.getConfig().auth;
  }

  logger(): LoggerService | undefined {
    return;
  }

  private static _shared: KeycloakService;
  /**
   * Allow a singleton access to the KeycloakService for areas
   * of the application that are not part of the dependency
   * injection framework.
   */
  public static get shared(): KeycloakService {
    return (
      KeycloakService._shared || (this._shared = new this(new ConfigService()))
    );
  }

  /**
   * Get the Open Id Configuration.
   * Keycloack exposes Open Id Configuration in a public URL
   * (e.g. https://dev.oidc.gov.bc.ca/auth/realms/jxoe2o46/.well-known/openid-configuration).
   * This endpoint provides a way to discover other useful endpoints and more.
   * @returns Open Id Configuration.
   */
  public async getOpenIdConfig(): Promise<OpenIdConfig> {
    try {
      const response = await axios.get(this.authConfig.openIdConfigurationUrl);
      return response.data as OpenIdConfig;
    } catch (ex) {
      // TODO: Add a logger.
      this.logger().log(ex);
      throw new Error("Error while loading Open Id Configuration.");
    }
  }

  /**
   * Keycloack exposes realm configuration that are public available and could be retrieve
   * using the issuerUrl (e.g. https://dev.oidc.gov.bc.ca/auth/realms/jxoe2o46).
   * The issuerUrl is one of the endpoints present on Open Id Configuration.
   * @returns Realm Config.
   */
  public async getRealmConfig(): Promise<RealmConfig> {
    try {
      const response = await axios.get(KeycloakConfig.openIdConfig.issuer);
      return {
        public_key: response.data.public_key,
        token_service: response.data["token-service"],
        account_service: response.data["account-service"],
      };
    } catch (ex) {
      // TODO: Add a logger.
      this.logger().log(ex);
      throw new Error("Error while loading Realm Config.");
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
  ): Promise<TokenResponse> {
    try {
      const data = stringify({
        grant_type: "password",
        client_id: clientId,
        username,
        password,
      });
      const response = await axios.post(
        KeycloakConfig.openIdConfig.token_endpoint,
        data,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        },
      );
      return response.data as TokenResponse;
    } catch (ex) {
      // TODO: Add a logger.
      this.logger().log(ex);
      throw new Error("Error while requesting user token.");
    }
  }
}
