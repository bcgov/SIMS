/**
 * Origin of the overword added to the student account.
 */
export enum DisbursementOverawardOriginType {
  /**
   * Entry manually added by the Ministry user.
   */
  ManualEntry = "Manual entry",
  /**
   * The result of an assessment recalculation generated
   * some overaward that exceeded the reassessment value.
   */
  Reassessment = "Reassessment",
  /**
   * A disbursement that included an overaward was cancelled and
   * the overaward value must to be added back to the student account.
   */
  CancelledDisbursement = "Cancelled disbursement",
  /**
   * Imported value from SFAS added during student creation or when SFAS
   * data is imported to the system.
   */
  Imported = "Imported",
}
