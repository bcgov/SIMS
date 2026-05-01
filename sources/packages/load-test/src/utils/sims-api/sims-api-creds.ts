import {
  E2E_TEST_STUDENT_PASSWORD,
  E2E_TEST_STUDENT_USERNAME,
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

/**
 * E2E test student credentials used for application submission load test.
 * @returns student credentials.
 */
export function getStudentCredentials(): UserPasswordCredential {
  return {
    userName: E2E_TEST_STUDENT_USERNAME,
    password: E2E_TEST_STUDENT_PASSWORD,
  };
}
