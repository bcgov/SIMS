import { Injectable } from "@nestjs/common";
import { KeycloakService, ConfigService, TokenCacheService } from "..";
import { ClientCredential } from "../../types";
import { TokenCacheResponse } from "./token-cache.service.models";
import { JwtService } from "@nestjs/jwt";

/**
 * Helper class to provide easy access to tokens that
 * are shared across the application.
 * If a token has the potential to be consumed on multiples
 * services, it should be added here. If a token has a specific
 * use (e.g. Form.IO) and it will be consumed only by one service
 * it could leave only in that particular service.
 */
@Injectable()
export class TokensService {
  public readonly simsApiClient: TokenCacheService;

  constructor(
    private readonly keycloakService: KeycloakService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    // Configure the SIMS Api Client token.
    this.simsApiClient = new TokenCacheService("sims-api Keycloak client", () =>
      this.getSimsApiClientToken(),
    );
    // Others tokens could be added and configured here!
  }

  /**
   * Gets SIMS Api client token from client secret.
   * This method has the signature to fulfill what is
   * required by TokenCacheService.
   * @returns sims api client token
   */
  private async getSimsApiClientToken(): Promise<TokenCacheResponse> {
    const credential = this.configService.getConfig().simsApiClientCredential;
    return this.getTokenFromClientSecret(credential);
  }

  /**
   * Gets token from client secret.
   * @param credential credential to retrieve the token.
   * @returns token from client secret prepared to be added to cache.
   */
  private async getTokenFromClientSecret(
    credential: ClientCredential,
  ): Promise<TokenCacheResponse> {
    const tokenResponse = await this.keycloakService.getTokenFromClientSecret(
      credential.clientId,
      credential.clientSecret,
    );
    const decodedToken = this.jwtService.decode(tokenResponse.access_token);
    return {
      accessToken: tokenResponse.access_token,
      expiresIn: +decodedToken["exp"],
    };
  }
}
