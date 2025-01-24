/**
 * Indicates the status of the invoice in relation to its submission to CAS.
 */
export enum CASInvoiceStatus {
  /**
   * Record was created and has not been sent to CAS.
   */
  Pending = "Pending",
  /**
   * Record was sent to CAS.
   */
  Approved = "Sent",
  /**
   * Some error happened while trying to send the invoice to CAS
   * and a manual intervention is required.
   */
  Rejected = "Manual intervention",
}
