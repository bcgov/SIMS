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
