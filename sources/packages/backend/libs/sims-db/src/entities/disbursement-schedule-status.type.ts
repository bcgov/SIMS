/**
 * Indicates if the money amount information was already
 * sent to be paid to the student.
 */
export enum DisbursementScheduleStatus {
  /**
   * Waiting to be included in a e-Cert file.
   */
  Pending = "Pending",
  /**
   * The money values associated with the disbursement schedule
   * were included in an e-Cert file to be disbursed to the student.
   */
  Sent = "Sent",
  /**
   * The disbursement will no longer happen. Possible causes can include,
   * but are not limited to, when a reassessment happens or when the
   * application is canceled.
   */
  Declined = "Cancelled",
}
