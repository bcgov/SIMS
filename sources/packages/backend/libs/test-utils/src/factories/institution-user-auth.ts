import {
  InstitutionLocation,
  InstitutionUser,
  InstitutionUserAuth,
  InstitutionUserTypeAndRole,
} from "@sims/sims-db";

export function createFakeInstitutionUserAuth(
  institutionUser: InstitutionUser,
  userTypeRole: InstitutionUserTypeAndRole,
  location?: InstitutionLocation,
): InstitutionUserAuth {
  const auth = new InstitutionUserAuth();
  auth.authType = userTypeRole;
  auth.institutionUser = institutionUser;
  auth.location = location;
  return auth;
}
