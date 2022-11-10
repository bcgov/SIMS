import { Institution, InstitutionUser, User } from "@sims/sims-db";

export function createFakeInstitutionUser(
  user: User,
  institution: Institution,
): InstitutionUser {
  const institutionUser = new InstitutionUser();
  institutionUser.user = user;
  institutionUser.institution = institution;
  return institutionUser;
}
