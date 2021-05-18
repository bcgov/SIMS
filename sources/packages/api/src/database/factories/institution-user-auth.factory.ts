import * as faker from "faker";
import { InstitutionUserAuth } from "../entities";

export async function institutionUserAuthFactory(
  incoming: Partial<InstitutionUserAuth>,
): Promise<InstitutionUserAuth> {
  const auth = new InstitutionUserAuth();
  auth.authType = incoming?.authType;
  auth.institutionUser = incoming?.institutionUser;
  auth.location = incoming?.location;
  return auth;
}
