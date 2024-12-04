/**
 * Audiences recognized by the API.
 * This is present on aud token claim.
 */
export enum Audiences {
  /**
   * Audience for the SIMS API.
   * Every user token must have this audience to be considered valid.
   */
  SIMSApi = "sims-api",

  /**
   * Audience for the SIMS API External.
   * External access user token must have this additional audience to be considered valid.
   */
  SIMSApiExternal = "sims-api-external",
}
