/**
 * Possible status for a scholastic standing change request.
 */
export enum ScholasticStandingStatus {
  /**
   * A scholastic standing change request was requested by
   * the Institution and not yet approved by the Ministry.
   */
  Pending = "Pending",
  /**
   * A scholastic standing change request was approved
   * by the Ministry.
   */
  Approved = "Approved",
  /**
   * A scholastic standing change request was declined
   * by the Ministry.
   */
  Declined = "Declined",
}
