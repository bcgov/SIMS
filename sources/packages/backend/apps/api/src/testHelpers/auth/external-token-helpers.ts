import { getCachedToken } from "./token-helpers";

/**
 * Get the token for a external user.
 * @returns an external user token to be used in the tests
 */
export async function getExternalUserToken(): Promise<string> {
  const E2E_TEST_EXTERNAL_USER_CLIENT_ID = "e2e-external";
  const clientSecret = process.env.E2E_TEST_EXTERNAL_USER_CLIENT_SECRET!;
  return getCachedToken(E2E_TEST_EXTERNAL_USER_CLIENT_ID, {
    clientSecret,
  });
}
