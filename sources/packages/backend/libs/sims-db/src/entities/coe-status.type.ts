/**
 * Possible status for Confirmation of Enrollment, when the Application_status is in Enrollment
 */
export enum COEStatus {
  /**
   * Confirmation of Enrollment is Required.
   */
  required = "Required",
  /**
   * Confirmation of Enrollment is Completed.
   */
  completed = "Completed",
  /**
   * Confirmation of Enrollment is Declined.
   */
  declined = "Declined",
  /**
   * Confirmation of Enrollment is Not Required.
   */
  notRequired = "Not Required",
}
