/**
 * Different status of application specific offering change request.
 */
export enum ApplicationOfferingChangeRequestStatus {
  /**
   * The status is set when the institution creates a
   * application specific offering change request.
   */
  InProgressWithStudent = "In progress with student",
  /**
   * The status is set after student approval and waiting for
   * SABC action.
   */
  InProgressWithSABC = "In progress with SABC",
  /**
   * The status is set when the SABC approve the application specific offering
   * change request.
   */
  Approved = "Approved",
  /**
   * The status is set when student declines the application
   * specific offering change request.
   */
  DeclinedByStudent = "Declined by student",
  /**
   * The status is set when SABC declines the application
   * specific offering change request.
   */
  DeclinedBySABC = "Declined by SABC",
}
