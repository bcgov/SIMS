import * as faker from "faker";
import { InstitutionUser } from "../entities";

export async function institutionUserFactory(
  incoming?: Partial<InstitutionUser>,
): Promise<InstitutionUser> {
  const institutionUser = new InstitutionUser();
  institutionUser.user = incoming?.user;
  institutionUser.institution = incoming?.institution;
  return institutionUser;
}
