import { IdentityProviders } from "@sims/sims-db";

export interface UserInfo {
  userId?: number;
  lastName: string;
  givenNames: string;
  email: string;
  userName: string;
  birthdate: string;
  idp_user_name: string;
  identityProvider:
    | IdentityProviders.BCSC
    | IdentityProviders.BCeIDBoth
    | IdentityProviders.IDIR;
  bceidBusinessGuid?: string;
}
