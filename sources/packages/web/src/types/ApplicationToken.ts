import { KeycloakTokenParsed } from "keycloak-js";

/**
 * Identity providers (IDPs) available on Keyclock
 * and received as a token property named identityProvider.
 * Currently the Keycloak is configured to work with bceidboth,
 * bcsc, and idir IDPs. bceidbasic and bceidbusiness can be
 * derived from bceidboth checking if the token also has the
 * bceidBusinessGuid property populated.
 */
export enum IdentityProviders {
  /**
   * Allows authentication using wither basic or business BCeID.
   */
  BCeIDBoth = "bceidboth",
  /**
   * Allows only basic BCeID authentication.
   * Currently not configured on Keycloak.
   */
  BCeIDBasic = "bceidbasic",
  /**
   * Allows only business BCeID authentication.
   * Currently not configured on Keycloak.
   */
  BCeIDBusiness = "bceidbusiness",
  /**
   * Allows authentication using BC Services Card.
   */
  BCSC = "bcsc",
  /**
   * Allows authentication using Government IDIR.
   */
  IDIR = "idir",
}

/**
 * Specific identity providers that uniquely identifies the
 * authentication method.
 */
export type SpecificIdentityProviders =
  | IdentityProviders.BCSC
  | IdentityProviders.BCeIDBasic
  | IdentityProviders.BCeIDBusiness
  | IdentityProviders.IDIR;

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
