import { InstitutionUserAuthorizations } from "../services/institution-user-auth/institution-user-auth.models";
import { AuthorizedParties } from "./authorized-parties.enum";

/**
 * User information extracted from the token during the
 * authentication process on JwtStrategy validate method.
 */
export interface IUserToken {
  userId?: number;
  isActive?: boolean;
  userName: string;
  email: string;
  scope: string;
  lastName: string;
  birthdate: string;
  email_verified: string;
  gender: string;
  displayName: string;
  givenNames: string;
  identity_assurance_level: string;
  roles: string[];
  groups: string[];
  idp_user_name: string;
  authorizedParty: AuthorizedParties;
}

export interface IInstitutionUserToken extends IUserToken {
  authorizations: InstitutionUserAuthorizations;
}

export interface StudentUserToken extends IUserToken {
  studentId?: number;
}
