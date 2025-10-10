/**
 * Represents the different status values of an application exception request.
 */
export enum ApplicationExceptionRequestStatus {
  /**
   * Application exception request is waiting for the ministry assessment.
   */
  Pending = "Pending",
  /**
   * Application exception request is approved by the ministry.
   */
  Approved = "Approved",
  /**
   * Application exception request is declined by the ministry.
   */
  Declined = "Declined",
}
