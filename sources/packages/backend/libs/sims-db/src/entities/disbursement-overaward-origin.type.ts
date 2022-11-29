/**
 * Origin of the overword added to the student account.
 */
export enum DisbursementOverawardOriginType {
  /**
   * The result of an assessment recalculation generated
   * an award that was less than the disbursed amount.
   */
  ReassessmentOveraward = "Reassessment overaward",
  /**
   * Part of an overaward balance was used to change an award value.
   */
  AwardValueAdjusted = "Award value adjusted",
  /**
   * An award that included an overaward was cancelled and
   * the overaward value must to be added back to the overaward balance.
   */
  PendingAwardCancelled = "Pending award cancelled",
  /**
   * Entry manually added by the Ministry user.
   */
  ManuallyEntered = "Manually entered",
  /**
   * Imported value from SFAS added during student creation or when SFAS
   * data is imported to the system.
   */
  Imported = "Imported",
}
