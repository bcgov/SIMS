import { InstitutionUserAuthorizations } from "../services/institution-user-auth/institution-user-auth.models";
import { AuthorizedParties } from ".";
import { IdentityProviders, SpecificIdentityProviders } from "@sims/sims-db";

/**
 * User Roles extracted from the token during the
 * authentication process on JwtStrategy validate method.
 */
export interface Roles {
  roles: string[];
}

/**
 * Resource Access extracted from the token during the
 * authentication process on JwtStrategy validate method.
 */
export interface ResourceAccess {
  aest: Roles;
}

/**
 * User information extracted from the token during the
 * authentication process on JwtStrategy validate method.
 * Please note that some additional properties are appended
 * to the original token information. Please check the comments
 * on each property to know which information came from the
 * token and which information was retrieved after the
 * token validation.
 */
export interface IUserToken {
  /**
   * SIMS database user id populated after token validation.
   * Null if the user is not present on the DB yet.
   */
  userId?: number;
  /**
   * Indicates if the user is active on SIMS database.
   * Populated after token validation.
   */
  isActive?: boolean;
  /**
   * Unique Keycloak user name also saved as SIMS database user user_name.
   */
  userName: string;
  /**
   * User email from received token.
   */
  email: string;
  /**
   * User last name from received token.
   */
  lastName: string;
  /**
   * User birthdate from received token.
   */
  birthdate: string;
  /**
   * Given names (first name and middle name) from received token.
   */
  givenNames: string;
  /**
   * Access per resource, for instance, for every client, from received token
   * and defined on Keycloak.
   * So far, used only to define the Ministry roles that are associated with
   * an user authenticated using an IDIR.
   */
  resource_access: ResourceAccess;
  /**
   * User groups associated on Keycloak from the the received token.
   * So far, used only to define the Ministry groups that are associated with
   * an user authenticated using an IDIR.
   */
  groups: string[];
  /**
   * Available only for BCeID authenticated users.
   * For instance, "SIMS_COLLC" as opposed to Keycloak userName
   * that looks like "5e5cdf7132124249aa0eda5036e827e8@bceidboth"
   */
  idp_user_name: string;
  /**
   * Keycloak identity provider used by the user for authentication. Used to execute
   * further validations to ensure that the user was authenticated in one of the
   * expected IDPs. Also following the recommendations below
   * @see https://github.com/bcgov/sso-keycloak/wiki/Using-Your-SSO-Client#do-validate-the-idp-in-the-jwt
   */
  identityProvider:
    | IdentityProviders.BCSC
    | IdentityProviders.BCeIDBoth
    | IdentityProviders.IDIR;
  /**
   * For the bceidboth identityProvider present on the token, check if it is a basic or business BCeID.
   */
  identitySpecificProvider: SpecificIdentityProviders;
  /**
   * Authorized party, Keycloak client used for the authentication.
   */
  azp: AuthorizedParties;
  /**
   * Audience, Keycloak audience used for the authentication.
   */
  aud: string | string[];
  /**
   * When the user is authenticated using the bceidboth IDP and the user has a business BCeID account,
   * this property contains the guid that identifies his business.
   * This field can also be used to differentiate a business BCeID from a Basic BCeID user.
   * Right now this property is associated with the institution and student client on Keycloak because
   * these are the only clients using the bceidboth IDP.
   */
  bceidBusinessGuid?: string;

  /**
   * Client id of the Keycloak client used for the authentication.
   */
  client_id: string;
}

export interface IInstitutionUserToken extends IUserToken {
  authorizations: InstitutionUserAuthorizations;
}

export interface StudentUserToken extends IUserToken {
  studentId?: number;
}
