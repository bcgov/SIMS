import {
  INSTITUTION_ADMIN_USER,
  INSTITUTION_ADMIN_PASSWORD,
} from "../../../config.env";
import { UserPasswordCredential } from "../auth/models";

/**
 * Institution admin user credentials.
 * @returns admin user credentials.
 */
export function getInstitutionAdminCredentials(): UserPasswordCredential {
  return {
    userName: INSTITUTION_ADMIN_USER,
    password: INSTITUTION_ADMIN_PASSWORD,
  };
}
