/**
 * Approval status of a CAS invoice batch.
 */
export enum CASInvoiceBatchApprovalStatus {
  /**
   * Waiting for user approval.
   */
  Pending = "Pending",
  /**
   * Approved by a user.
   */
  Approved = "Approved",
  /**
   * Rejected by a user.
   */
  Rejected = "Rejected",
}
