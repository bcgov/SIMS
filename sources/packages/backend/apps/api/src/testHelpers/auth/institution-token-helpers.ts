import {
  SIMS2_COLLC_USER,
  SIMS2_COLLD_USER,
  SIMS2_COLLE_USER,
  SIMS2_COLLF_USER,
  SIMS_COLLC_ADMIN_LEGAL_SIGNING_USER,
  SIMS_COLLD_ADMIN_NON_LEGAL_SIGNING_USER,
  SIMS_COLLE_ADMIN_NON_LEGAL_SIGNING_USER,
  SIMS_COLLF_ADMIN_LEGAL_SIGNING_USER,
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
  /**
   * SIMS_COLLE user configured as an admin without legal signing officer.
   */
  CollegeEAdminNonLegalSigningUser,
  /**
   * SIMS2_COLLE user configured as a read-only user.
   * Please do not add user type 'user' to this user as it is intended to be used as a read-only user.
   */
  CollegeEReadOnlyUser,
  /**
   * SIMS_COLLF user configured as an admin and also as a legal signing officer.
   */
  CollegeFAdminLegalSigningUser,
  /**
   * SIMS2_COLLF user configured as a regular user.
   */
  CollegeFUser,
}

/**
 * Get a valid authentication token for an institution.
 * @param userType available institution users to have the token acquired.
 * @returns authentication token.
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
    case InstitutionTokenTypes.CollegeEAdminNonLegalSigningUser:
      credential = {
        userName: SIMS_COLLE_ADMIN_NON_LEGAL_SIGNING_USER,
        password: process.env.E2E_TEST_PASSWORD,
      };
      break;
    case InstitutionTokenTypes.CollegeEReadOnlyUser:
      credential = {
        userName: SIMS2_COLLE_USER,
        password: process.env.E2E_TEST_PASSWORD,
      };
      break;
    case InstitutionTokenTypes.CollegeFAdminLegalSigningUser:
      credential = {
        userName: SIMS_COLLF_ADMIN_LEGAL_SIGNING_USER,
        password: process.env.E2E_TEST_PASSWORD,
      };
      break;
    case InstitutionTokenTypes.CollegeFUser:
      credential = {
        userName: SIMS2_COLLF_USER,
        password: process.env.E2E_TEST_PASSWORD,
      };
      break;
  }
  return getCachedToken(AuthorizedParties.institution, {
    userPasswordCredential: credential,
    uniqueTokenCache: userType.toString(),
  });
}
