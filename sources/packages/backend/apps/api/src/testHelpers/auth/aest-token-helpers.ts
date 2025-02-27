import { UserPasswordCredential } from "@sims/utilities/config";
import { AuthorizedParties } from "../../auth";
import { getCachedToken } from "./token-helpers";

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
 * Gets different tokens for the Ministry application.
 * @param group group to have the token acquired.
 * When value is not passed then returns token for read-only user.
 * @returns a ministry token for the specific group.
 */
export async function getAESTToken(group?: AESTGroups): Promise<string> {
  let credential: UserPasswordCredential;
  switch (group) {
    case AESTGroups.BusinessAdministrators:
      credential = {
        userName: process.env.E2E_TEST_AEST_BUSINESS_ADMINISTRATORS_USER,
        password: process.env.E2E_TEST_PASSWORD,
      };
      break;
    case AESTGroups.Operations:
      credential = {
        userName: process.env.E2E_TEST_AEST_OPERATIONS_USER,
        password: process.env.E2E_TEST_PASSWORD,
      };
      break;
    case AESTGroups.OperationsAdministrators:
      credential = {
        userName: process.env.E2E_TEST_AEST_OPERATIONS_ADMINISTRATORS_USER,
        password: process.env.E2E_TEST_PASSWORD,
      };
      break;
    case AESTGroups.MOFOperations:
      credential = {
        userName: process.env.E2E_TEST_AEST_MOF_OPERATIONS_USER,
        password: process.env.E2E_TEST_PASSWORD,
      };
      break;
    default:
      credential = {
        userName: process.env.E2E_TEST_AEST_READ_ONLY_USER,
        password: process.env.E2E_TEST_PASSWORD,
      };
  }
  return getCachedToken(AuthorizedParties.aest, {
    userPasswordCredential: credential,
    uniqueTokenCache: group?.toString(),
  });
}
