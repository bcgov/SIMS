import { JwtService } from "@nestjs/jwt";
import { UserPasswordCredential } from "@sims/utilities/config";
import { AuthorizedParties, KeycloakConfig } from "../../auth";
import { KeycloakService, TOKEN_RENEWAL_SECONDS } from "../../services";
import { TokenCacheResponse } from "../../services/auth/token-cache.service.models";
import { needRenewJwtToken } from "../../utilities";

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
 * Known AEST groups. The API right now performs authorization for
 * Ministry users based on the roles associated to these groups.
 * These groups represents the different logins with the different
 * set of roles to be used to execute E2E tests when roles validations
 * are required.
 */
export enum AESTGroups {
  BusinessAdministrators = "business-administrators",
  Operations = "operations",
  OperationsAdministrators = "operations-administrators",
  MOFOperations = "mof-operations",
}

/**
 * Get a token for a Keycloak client optionally using a different
 * cache key when there are variations of a token under the same client.
 * For instance, for the Ministry, a token for each group can be acquired.
 * @param authorizedParty Keycloak client.
 * @param credentials user and password to acquire the token (the user must have
 * a hardcoded password to bypass the Keycloak identity provider).
 * @param uniqueTokenCache different cache key when there are variations of
 * a token under the same client
 * @returns a token that can be used to perform a API call. Intended to be
 * used only for E2E tests.
 */
async function getCachedToken(
  authorizedParty: AuthorizedParties,
  credentials: UserPasswordCredential,
  uniqueTokenCache = "",
): Promise<string> {
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
      credentials.userName,
      credentials.password,
      authorizedParty,
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
 * Gets different tokens for the Ministry application.
 * @param group group to have the token acquired.
 * @returns a ministry token for the specific group.
 */
export async function getAESTToken(group: AESTGroups): Promise<string> {
  let credential: UserPasswordCredential;
  switch (group) {
    case AESTGroups.BusinessAdministrators:
      credential = {
        userName: process.env.E2E_TEST_AEST_BUSINESS_ADMINISTRATORS_USER,
        password: process.env.E2E_TEST_AEST_BUSINESS_ADMINISTRATORS_PASSWORD,
      };
      break;
    case AESTGroups.Operations:
      credential = {
        userName: process.env.E2E_TEST_AEST_OPERATIONS_USER,
        password: process.env.E2E_TEST_AEST_OPERATIONS_PASSWORD,
      };
      break;
    case AESTGroups.OperationsAdministrators:
      credential = {
        userName: process.env.E2E_TEST_AEST_OPERATIONS_ADMINISTRATORS_USER,
        password: process.env.E2E_TEST_AEST_OPERATIONS_ADMINISTRATORS_PASSWORD,
      };
      break;
    case AESTGroups.MOFOperations:
      credential = {
        userName: process.env.E2E_TEST_AEST_MOF_OPERATIONS_USER,
        password: process.env.E2E_TEST_AEST_MOF_OPERATIONS_PASSWORD,
      };
      break;
  }
  return getCachedToken(AuthorizedParties.aest, credential, group.toString());
}
