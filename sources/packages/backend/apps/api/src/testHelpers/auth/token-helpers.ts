import { JwtService } from "@nestjs/jwt";
import { UserPasswordCredential } from "@sims/utilities/config";
import { AuthorizedParties, KeycloakConfig } from "../../auth";
import { KeycloakService, TOKEN_RENEWAL_SECONDS } from "../../services";
import { TokenCacheResponse } from "../../services/auth/token-cache.service.models";
import { needRenewJwtToken } from "../../utilities";

export const BEARER_AUTH_TYPE: { type: "bearer" } = { type: "bearer" };
const jwtService = new JwtService();
const tokenCache: Record<string, TokenCacheResponse> = {};

export enum AESTGroups {
  BusinessAdministrators = "business-administrators",
  Operations = "operations",
  OperationsAdministrators = "operations-administrators",
  MOFOperations = "mof-operations",
}

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
