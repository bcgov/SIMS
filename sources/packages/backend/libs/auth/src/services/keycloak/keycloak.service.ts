import { Injectable } from "@nestjs/common";
import { stringify } from "qs";
import { TokenRequest, TokenResponse } from "./token.model";
import { RealmConfig } from "./realm-config.model";
import { OpenIdConfig } from "./openid-config.model";
import { KeycloakConfig } from "../../config";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import {
  AuthConfig,
  ConfigService,
  UserPasswordCredential,
} from "@sims/utilities/config";
import { HttpService } from "@nestjs/axios";

/**
 * Manage the HTTP requests that need to be executed to Keycloak.
 * This service allows a singleton access to the KeycloakService
 * with the intention to be used on areas of the application that
 * are not part of the dependency injection framework.
 * All others areas should prefer to have it inject to make it easier
 * to create mockups for unit tests.
 */
@Injectable()
export class KeycloakService {
  private readonly authConfig: AuthConfig;

  @InjectLogger()
  logger: LoggerService;

  constructor(
    configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.authConfig = configService.auth;
  }

  private static _shared: KeycloakService;
  /**
   * Allow a singleton access to the KeycloakService for areas
   * of the application that are not part of the dependency
   * injection framework.
   */
  public static get shared(): KeycloakService {
    return (
      KeycloakService._shared ||
      (this._shared = new this(new ConfigService(), new HttpService()))
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
      const response = await this.httpService.axiosRef.get(
        this.authConfig.openIdConfigurationUrl,
      );
      return response.data as OpenIdConfig;
    } catch (ex) {
      // TODO: Add a logger.
      this.logger.error(ex);
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
      const response = await this.httpService.axiosRef.get(
        KeycloakConfig.openIdConfig.issuer,
      );

      return {
        public_key: response.data.public_key,
        token_service: response.data["token-service"],
        account_service: response.data["account-service"],
      };
    } catch (ex) {
      // TODO: Add a logger.
      this.logger.error(ex);
      throw new Error("Error while loading Realm Config.");
    }
  }

  /**
   * Retrieve an token from Keycloak using a provided user name and password.
   * @param clientId Client ID.
   * @param options options
   * - `userPasswordCredential` credential to obtain authentication token.
   * - `clientSecret` client secret to obtain authentication token.
   * @returns token.
   */
  async getToken(
    clientId: string,
    options: {
      userPasswordCredential?: UserPasswordCredential;
      clientSecret?: string;
    },
  ): Promise<TokenResponse> {
    let payload: TokenRequest;
    if (options.userPasswordCredential) {
      payload = {
        grant_type: "password",
        client_id: clientId,
        username: options.userPasswordCredential.userName,
        password: options.userPasswordCredential.password,
      };
    } else {
      payload = {
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: options.clientSecret,
      };
    }

    return this.getKeyCloakToken(payload);
  }

  /**
   * Retrieve an token from Keycloak.
   * @param payload Payload request (e.g. password or client_credentials).
   * @returns token
   */
  private async getKeyCloakToken(
    payload: TokenRequest,
  ): Promise<TokenResponse> {
    try {
      const data = stringify(payload);
      const response = await this.httpService.axiosRef.post(
        KeycloakConfig.openIdConfig.token_endpoint,
        data,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        },
      );
      return response.data as TokenResponse;
    } catch (ex) {
      this.logger.error(ex);
      throw new Error("Error while requesting user token.");
    }
  }
}
