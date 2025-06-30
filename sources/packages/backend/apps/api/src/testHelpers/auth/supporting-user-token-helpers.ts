import { getCachedToken } from "./token-helpers";
import { UserPasswordCredential } from "@sims/utilities/config";
import { AuthorizedParties } from "../../auth";

export enum FakeSupportingUserTypes {
  /**
   * Fake supporting user type used for simple tests.
   */
  FakeSupportingUserType1,
}

/**
 * Get a supporting user token for testing purposes.
 * @param userType type of the supporting user.
 * @returns supporting user token.
 */
export async function getSupportingUserToken(
  userType: FakeSupportingUserTypes,
): Promise<string> {
  const credential: UserPasswordCredential = {
    userName: "fake-supporting-user",
    password: "fake-password",
  };

  return getCachedToken(
    credential,
    AuthorizedParties.SupportingUsers,
    userType.toString(),
  );
} 