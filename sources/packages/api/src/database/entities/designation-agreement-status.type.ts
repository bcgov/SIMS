/**
 * Possible status for a designation agreement.
 */
export enum DesignationAgreementStatus {
  /**
   * The designation agreement was submitted by the institution and
   * it is still pending to the Ministry approve or decline.
   */
  Pending = "Pending",
  /**
   * The designation agreement previously submitted by the institution
   * was approved by the Ministry.
   */
  Approved = "Approved",
  /**
   * The designation agreement previously submitted by the institution
   * was declined by the Ministry.
   */
  Declined = "Declined",
}
