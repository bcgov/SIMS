import { JwtService } from "@nestjs/jwt";
import { UserPasswordCredential } from "@sims/utilities/config";
import { AuthorizedParties, IUserToken } from "../../auth";
import { TOKEN_RENEWAL_SECONDS } from "../../services";
import { TokenCacheResponse } from "../../services/auth/token-cache.service.models";
import { needRenewJwtToken } from "../../utilities";
import { KeycloakService } from "@sims/auth/services";
import { KeycloakConfig } from "@sims/auth/config";
import { getProviderInstanceForModule } from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import { AuthModule } from "../../auth/auth.module";
import { JwtStrategy } from "../../auth/jwt.strategy";

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
 * - `uniqueTokenCache` different cache key when there are variations of
 *    a token under the same client.
 */
export async function getCachedToken(
  authorizedParty: AuthorizedParties,
  options: {
    userPasswordCredential: UserPasswordCredential;
    uniqueTokenCache?: string;
  },
): Promise<string>;

/**
 * Get a token for a Keycloak client optionally using a different
 * cache key when there are variations of a token under the same client.
 * For instance, for the Ministry, a token for each group can be acquired.
 * @param authorizedParty keycloak client.
 * @param options options
 * - `clientSecret` client secret to obtain authentication token.
 * - `uniqueTokenCache` different cache key when there are variations of
 *    a token under the same client.
 */
export async function getCachedToken(
  authorizedParty: AuthorizedParties,
  options: {
    clientSecret: string;
    uniqueTokenCache?: string;
  },
): Promise<string>;

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

/**
 * Allow the manipulation of the JWT token payload used in the tests by mocking the validate method
 * of the JwtStrategy to override the user information in the payload with the provided one.
 * @param testingModule nest testing module.
 * @param tokenCallback callback function to manipulate the token payload with the provided user information.
 * @returns the spy instance of the mocked validate method.
 */
export async function mockJWTToken(
  testingModule: TestingModule,
  tokenCallback: (payload: IUserToken) => void,
): Promise<jest.SpyInstance> {
  const jwtStrategy = await getProviderInstanceForModule(
    testingModule,
    AuthModule,
    JwtStrategy,
  );
  // Keep the original validate method to call it after modifying the payload.
  const originalValidate = jwtStrategy.validate.bind(jwtStrategy);
  return jest
    .spyOn(jwtStrategy, "validate")
    .mockImplementationOnce((payload: IUserToken) => {
      // Allow the manipulation of the token payload
      // with the provided user information.
      tokenCallback(payload);
      return originalValidate(payload);
    });
}
