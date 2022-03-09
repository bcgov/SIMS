/**
 * Possible status for a student appeal request.
 */
export enum StudentAppealStatus {
  /**
   * A student appeal was requested by the student
   * and not yet approved by the Ministry.
   */
  Pending = "Pending",
  /**
   * A student appeal was approved by the Ministry.
   */
  Approved = "Approved",
  /**
   * A student appeal was declined by the Ministry.
   */
  Declined = "Declined",
}
