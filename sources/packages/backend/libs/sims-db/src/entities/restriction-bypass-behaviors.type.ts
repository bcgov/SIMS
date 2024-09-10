/**
 * Defines how the bypass should behave, for instance, until when it will be valid.
 */
export enum RestrictionBypassBehaviors {
  /**
   * Any disbursement associated with the application will have the restriction
   * ignored if the bypass is active. Any reassessment will continue to ignore
   * the restrictions.
   */
  AllDisbursements = "All disbursements",
  /**
   * When the next e-Cert is marked as 'Ready to send' the bypass should be removed.
   */
  NextDisbursementOnly = "Next disbursement only",
}
