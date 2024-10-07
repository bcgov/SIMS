import { KeycloakTokenParsed } from "keycloak-js";

export enum IdentityProviders {
  BCeIDBoth = "bceidboth",
  BCSC = "bcsc",
  IDIR = "idir",
  BCeIDBasic = "bceidbasic",
  BCeIDBusiness = "bceidbusiness",
}

export interface ApplicationToken extends KeycloakTokenParsed {
  /**
   * Identity provider used by the user for authentication. Used to execute
   * further validations to ensure that the user was authenticated in one of the
   * expected IDPs. Also following the recommendations below
   * @see https://github.com/bcgov/sso-keycloak/wiki/Using-Your-SSO-Client#do-validate-the-idp-in-the-jwt
   */
  identityProvider: IdentityProviders;
  /**
   * Unique Keycloak user name also saved as SIMS database user user_name.
   */
  userName: string;
  /**
   * Keycloak client used for the authentication.
   */
  azp: string;
}

export interface BCSCParsedToken extends ApplicationToken {
  name: string;
  birthdate: string;
  givenNames: string;
  lastName: string;
  email: string;
  emailVerified: string;
  familyName: string;
  gender: string;
  givenName: string;
}

export interface BCeIDParsedToken extends ApplicationToken {
  givenNames: string;
  email: string;
}
