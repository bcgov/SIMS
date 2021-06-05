import { AuthorizedParties } from "./authorized-parties.enum";

/**
 * User information extraced from the token during the
 * authentication process on JwtStrategy validate method.
 */
export interface IUserToken {
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
  idp_user_name: string;
  authorizedParty: AuthorizedParties;
}
