/**
 * {@link ApplicationOfferingChangeRequestStatus} the different status of application offering
 * change request.
 */
export enum ApplicationOfferingChangeRequestStatus {
  /**
   * {@link InProgressWithTheStudent} is set when the institution creates a
   * application offering change request.
   */
  InProgressWithTheStudent = "In progress with the student",
  /**
   * {@link InProgressWithSABC} is set after student approval and waiting for
   * SABC approval.
   */
  InProgressWithSABC = "In progress with SABC",
  /**
   * {@link Approved} is set when the SABC approve the application offering
   * change request.
   */
  Approved = "Approved",
  /**
   * {@link DeclinedByStudent} is set when student declines the application
   * offering change request.
   */
  DeclinedByStudent = "Declined by student",
  /**
   * {@link DeclinedBySABC} is set when SABC declines the application
   * offering change request.
   */
  DeclinedBySABC = "Declined by SABC",
}
