import * as faker from "faker";
import { InstitutionUserAuth } from "../entities";
// TODO: ANN REVIEW AND REMOVE IF NOT REQUIRED ALL FACTORIES

export async function institutionUserAuthFactory(
  incoming: Partial<InstitutionUserAuth>,
): Promise<InstitutionUserAuth> {
  const auth = new InstitutionUserAuth();
  auth.authType = incoming?.authType;
  auth.institutionUser = incoming?.institutionUser;
  auth.location = incoming?.location;
  return auth;
}
