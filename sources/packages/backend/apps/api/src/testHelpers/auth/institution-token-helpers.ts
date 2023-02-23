import {
  SIMS2_COLLC_USER,
  SIMS2_COLLD_USER,
  SIMS_COLLC_ADMIN_LEGAL_SIGNING_USER,
  SIMS_COLLD_ADMIN_NON_LEGAL_SIGNING_USER,
} from "@sims/test-utils/constants";
import { UserPasswordCredential } from "@sims/utilities/config";
import { AuthorizedParties } from "../../auth";
import { getCachedToken } from "./token-helpers";

/**
 * Available institution users for authentication.
 */
export enum InstitutionTokenTypes {
  /**
   * SIMS_COLLC user configured as an admin and also as a legal signing officer.
   */
  CollegeCAdminLegalSigningUser,
  /**
   * SIMS2_COLLC user configured as a regular user.
   */
  CollegeCUser,
  /**
   * SIMS_COLLD user configured as an admin without legal signing officer.
   */
  CollegeDAdminNonLegalSigningUser,
  /**
   * SIMS2_COLLD user configured as a regular user.
   */
  CollegeDUser,
}

/**
 * Get a valid authentication token for an institution.
 * @param userType
 * @returns
 */
export async function getInstitutionToken(
  userType: InstitutionTokenTypes,
): Promise<string> {
  let credential: UserPasswordCredential;
  switch (userType) {
    case InstitutionTokenTypes.CollegeCAdminLegalSigningUser:
      credential = {
        userName: SIMS_COLLC_ADMIN_LEGAL_SIGNING_USER,
        password: process.env.E2E_TEST_PASSWORD,
      };
      break;
    case InstitutionTokenTypes.CollegeCUser:
      credential = {
        userName: SIMS2_COLLC_USER,
        password: process.env.E2E_TEST_PASSWORD,
      };
      break;
    case InstitutionTokenTypes.CollegeDAdminNonLegalSigningUser:
      credential = {
        userName: SIMS_COLLD_ADMIN_NON_LEGAL_SIGNING_USER,
        password: process.env.E2E_TEST_PASSWORD,
      };
      break;
    case InstitutionTokenTypes.CollegeDUser:
      credential = {
        userName: SIMS2_COLLD_USER,
        password: process.env.E2E_TEST_PASSWORD,
      };
      break;
  }
  return getCachedToken(
    AuthorizedParties.institution,
    credential,
    userType.toString(),
  );
}
