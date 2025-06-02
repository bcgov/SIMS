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
   * All e-Cert calculations are done for the disbursement and it is ready
   * to be added to an e-Cert. This status has the same effect as 'Sent'
   * when the system should consider that no further modifications will
   * be executed to the e-Cert related data.
   */
  ReadyToSend = "Ready to send",
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
  Cancelled = "Cancelled",
  /**
   * The status indicates that the disbursement has been rejected by ESDC
   * after being sent.
   */
  Rejected = "Rejected",
}
