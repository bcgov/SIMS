/**
 * {@link ApplicationOfferingChangeRequestStatus} is the different status of application
 * specific offering change request.
 */
export enum ApplicationOfferingChangeRequestStatus {
  /**
   * {@link InProgressWithTheStudent} is set when the institution creates a
   * application specific offering change request.
   */
  InProgressWithTheStudent = "In progress with the student",
  /**
   * {@link InProgressWithSABC} is set after student approval and waiting for
   * SABC action.
   */
  InProgressWithSABC = "In progress with SABC",
  /**
   * {@link Approved} is set when the SABC approve the application specific offering
   * change request.
   */
  Approved = "Approved",
  /**
   * {@link DeclinedByStudent} is set when student declines the application
   * specific offering change request.
   */
  DeclinedByStudent = "Declined by student",
  /**
   * {@link DeclinedBySABC} is set when SABC declines the application
   * specific offering change request.
   */
  DeclinedBySABC = "Declined by SABC",
}
