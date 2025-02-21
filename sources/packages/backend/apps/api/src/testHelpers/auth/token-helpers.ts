import { JwtService } from "@nestjs/jwt";
import { UserPasswordCredential } from "@sims/utilities/config";
import { AuthorizedParties } from "../../auth";
import { TOKEN_RENEWAL_SECONDS } from "../../services";
import { TokenCacheResponse } from "../../services/auth/token-cache.service.models";
import { needRenewJwtToken } from "../../utilities";
import { KeycloakService } from "@sims/auth/services";
import { KeycloakConfig } from "@sims/auth/config";

/**
 * Bearer type used by supertest package.
 */
export const BEARER_AUTH_TYPE: { type: "bearer" } = { type: "bearer" };
/**
 * JWT service used to decode the token and have access, for instance, to the
 * expiration time required to determine if the token can still be reused or
 * must be renewed.
 */
const jwtService = new JwtService();
/**
 * Caches the token already acquired.
 */
const tokenCache: Record<string, TokenCacheResponse> = {};

/**
 * Get a token for a Keycloak client optionally using a different
 * cache key when there are variations of a token under the same client.
 * For instance, for the Ministry, a token for each group can be acquired.
 * @param authorizedParty Keycloak client.
 * @param options options
 * - `userPasswordCredential` credential to obtain authentication token.
 * - `clientSecret` client secret to obtain authentication token.
 * - `uniqueTokenCache` different cache key when there are variations of
 *    a token under the same client.
 * @returns a token that can be used to perform a API call. Intended to be
 * used only for E2E tests.
 */
export async function getCachedToken(
  authorizedParty: AuthorizedParties,
  options: {
    userPasswordCredential?: UserPasswordCredential;
    clientSecret?: string;
    uniqueTokenCache?: string;
  },
): Promise<string> {
  const uniqueTokenCache = options.uniqueTokenCache ?? "";
  const tokenCacheKey = `e2e_token_cache_${authorizedParty}${uniqueTokenCache}`;
  if (
    !tokenCache[tokenCacheKey] ||
    needRenewJwtToken(
      tokenCache[tokenCacheKey].expiresIn,
      TOKEN_RENEWAL_SECONDS,
    )
  ) {
    await KeycloakConfig.load();
    const aestToken = await KeycloakService.shared.getToken(
      authorizedParty,
      options,
    );
    const decodedToken = jwtService.decode(aestToken.access_token);
    tokenCache[tokenCacheKey] = {
      accessToken: aestToken.access_token,
      expiresIn: +decodedToken["exp"],
    } as TokenCacheResponse;
  }
  return tokenCache[tokenCacheKey].accessToken;
}
