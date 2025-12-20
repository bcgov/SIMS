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
   * Part of a positive overaward balance was used to change an award value.
   * Positive overaward balance means that the student owes money to the Ministry,
   * and this overaward was used to reduce an award value.
   */
  AwardDeducted = "Award deducted",
  /**
   * Part of a negative overaward balance was used to change an award value.
   * Negative overaward balance means that the student has a credit balance
   * (the Ministry owes money to the student), and this credit
   * was used to increase an award value.
   */
  AwardCredited = "Award credited",
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
   * due to the disbursement being rejected by ESDC.
   */
  AwardRejectedDeducted = "Award rejected deducted",
}
