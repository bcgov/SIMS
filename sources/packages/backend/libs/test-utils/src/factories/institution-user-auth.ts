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
  // For institution admin there is no location.
  auth.location = location;
  return auth;
}
