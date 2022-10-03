import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { needRenewJwtToken, tokenTimeToDate } from "../../utilities/auth-utils";
import { TokenCacheResponse } from "./token-cache.service.models";

// Amount of seconds before the token expires that should be
// considered to renew it. For instance, if a token has 10min
// expiration and the below const is defined as 30, the token will
// be renewed if the token was acquired 9min30s ago or if it is
// already expired.
export const TOKEN_RENEWAL_SECONDS = 30;

/**
 * Keeps a token that could be shared accross the application
 * and monitors the expiration time to determined when it
 * need to be renewed.
 * The responsability of this service is to mantain a cache for
 * a token and monitors its expiration. The actual method that
 * retrieves the token will be provide as a parameter.
 */
export class TokenCacheService {
  private token: TokenCacheResponse = null;

  /**
   * Creates an instance of token cache service.
   * @param name friendly name for logging.
   * @param tokenAquireMethod method responsible for acquiring a new token.
   */
  constructor(
    private readonly name: string,
    private readonly tokenAquireMethod: () => Promise<TokenCacheResponse>,
  ) {
    this.logger.log(`TokenCacheService created for '${name}'.`);
  }

  /**
   * Gets the token checking if there is one present on cache and
   * if it is not about to expired. If the token is not present
   * or it is about to expire, a new one will be retrieved.
   * @returns token
   */
  public async getToken(): Promise<string> {
    // Check if there is a token in the cache and if it is still valid.
    if (
      this.token &&
      !needRenewJwtToken(this.token.expiresIn, TOKEN_RENEWAL_SECONDS)
    ) {
      this.logger.log(
        `Reused cache token for '${
          this.name
        }'. Token will expire at  ${tokenTimeToDate(this.token.expiresIn)}`,
      );
      return this.token.accessToken;
    }

    try {
      // Token is not present or it is about to expire, retrieve a new token.
      this.token = await this.tokenAquireMethod();
      this.logger.log(
        `New token acquired for '${
          this.name
        }'. Token will expire at  ${tokenTimeToDate(this.token.expiresIn)}`,
      );
      return this.token.accessToken;
    } catch (error) {
      this.logger.debug(
        `Error while acquiring token. Name: '${this.name}', error ${error}`,
      );
      throw error;
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
