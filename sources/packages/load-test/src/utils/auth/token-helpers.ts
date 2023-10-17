import http from "k6/http";
import { AuthorizedParties } from "../sims-api/sims-api";
import { KEY_CLOAK_TOKEN_URL } from "../../../config.env";
import { decodeJWT } from "./jwt-helpers";
import { TokenCacheResponse, UserPasswordCredential } from "./models";

/**
 * Default amount of time to a token be expired and be
 * considered candidate to be renewed.
 */
const TOKEN_RENEWAL_SECONDS = 30;

/**
 * Caches the token already acquired.
 */
const tokenCache: Record<string, TokenCacheResponse> = {};

/**
 * Define if a token need to be renewed based in the jwt exp property.
 * @param jwtExp exp token property that defines the expiration.
 * @param maxSecondsToExpired Amount of seconds before the token expires that should be considered to renew it.
 * For instance, if a token has 10min expiration and the parameter is defined as 30, the token will
 * be renewed if the token was acquired 9min30s ago or if it is already expired.
 * @returns true if the token is expired or about to expire based on the property maxSecondsToExpired.
 */
function needRenewJwtToken(jwtExp: number, maxSecondsToExpired = 0): boolean {
  const jwtExpMilliseconds = jwtExp * 1000; // Convert to milliseconds.
  const maxSecondsToExpiredMilliseconds = maxSecondsToExpired * 1000; // Convert to milliseconds.
  const expiredDate = new Date(
    jwtExpMilliseconds - maxSecondsToExpiredMilliseconds
  );
  return new Date() > expiredDate;
}

/**
 * Get a token for a Keycloak client optionally using a different
 * cache key when there are variations of a token under the same client.
 * For instance, for the Ministry, a token for each group can be acquired.
 * @param authorizedParty Keycloak client.
 * @param credentials user and password to acquire the token (the user must have
 * a hardcoded password to bypass the Keycloak identity provider).
 * @param options.
 * - `uniqueTokenCache` different cache key when there are variations of
 * a token under the same client. If not provided the user name will be
 * used instead.
 * @returns a token that can be used to perform API calls. Intended to be
 * used only for the load tests.
 */
export function getCachedToken(
  authorizedParty: AuthorizedParties,
  credentials: UserPasswordCredential,
  options?: { uniqueTokenCache?: string }
): string {
  const tokenCacheKey = `load_test_token_cache_${
    options?.uniqueTokenCache ?? credentials.userName
  }`;
  if (
    !tokenCache[tokenCacheKey] ||
    needRenewJwtToken(
      tokenCache[tokenCacheKey].expiresIn,
      TOKEN_RENEWAL_SECONDS
    )
  ) {
    const accessToken = getToken(authorizedParty, credentials);
    const decodedToken = decodeJWT(accessToken);
    tokenCache[tokenCacheKey] = {
      accessToken,
      expiresIn: decodedToken.payload.exp,
    } as TokenCacheResponse;
  }
  return tokenCache[tokenCacheKey].accessToken;
}

/**
 * Get a token for a Keycloak client.
 * @param authorizedParty Keycloak client.
 * @param credentials user and password that must be set for the user.
 * @returns access token string.
 */
export function getToken(
  authorizedParty: AuthorizedParties,
  credentials: UserPasswordCredential
): string {
  const headers = { "Content-Type": "application/x-www-form-urlencoded" };
  const payload = {
    grant_type: "password",
    client_id: authorizedParty,
    username: credentials.userName,
    password: credentials.password,
  };
  const response = http.post(KEY_CLOAK_TOKEN_URL, payload, {
    headers,
  });
  if (response.status !== 200) {
    throw new Error(
      `Error while acquiring token. Error code: ${response.status_text}`
    );
  }
  const responseBody = JSON.parse(response.body.toString());
  return responseBody.access_token;
}
