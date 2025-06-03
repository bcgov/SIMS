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
   * Entry manually added by the Ministry user.
   */
  ManualRecord = "Manual record",
  /**
   * Imported value from SFAS added during student creation or when SFAS
   * data is imported to the system.
   */
  LegacyOveraward = "Legacy overaward",
  /**
   * Overaward paid by a disbursement award deduction was rejected
   * due to the disbursement being rejected by EDSC.
   */
  AwardDeductedRejected = "Award deducted rejected",
}
