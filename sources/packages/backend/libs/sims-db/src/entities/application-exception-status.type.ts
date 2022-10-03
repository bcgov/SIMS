/**
 * Represents the different status that a student
 * application exception can have.
 */
export enum ApplicationExceptionStatus {
  /**
   * Student application exceptions were detected and they
   * are waiting for the Ministry assessment.
   */
  Pending = "Pending",
  /**
   * Student application exceptions were approved by the Ministry.
   */
  Approved = "Approved",
  /**
   * Student application exceptions were denied by the Ministry.
   */
  Declined = "Declined",
}
