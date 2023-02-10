/**
 * Origin of the overaward added to the student account.
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
  AwardDeducted = "Award deducted",
  /**
   * An pending award that included an overaward was cancelled and
   * the overaward value must to be added back to the overaward balance.
   * @deprecated to be removed.
   */
  PendingAwardCancelled = "Pending award cancelled",
  /**
   * Entry manually added by the Ministry user.
   */
  ManualRecord = "Manual record",
  /**
   * Imported value from SFAS added during student creation or when SFAS
   * data is imported to the system.
   */
  LegacyOveraward = "Legacy overaward",
}
