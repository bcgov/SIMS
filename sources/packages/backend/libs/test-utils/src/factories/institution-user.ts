import { Institution, InstitutionUser, User } from "@sims/sims-db";
import { createFakeInstitution } from "./institution";
import { createFakeUser } from "./user";

export function createFakeInstitutionUser(
  user?: User,
  institution?: Institution,
): InstitutionUser {
  const institutionUser = new InstitutionUser();
  institutionUser.user = user ?? createFakeUser();
  institutionUser.institution = institution ?? createFakeInstitution();
  return institutionUser;
}
