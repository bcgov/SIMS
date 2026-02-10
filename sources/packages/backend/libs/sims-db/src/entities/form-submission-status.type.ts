/**
 * Status for form submission that contains one to many
 * forms to be assessed and have a decision assigned.
 */
export enum FormSubmissionStatus {
  /**
   * The submission has one or more forms pending decision.
   */
  Pending = "Pending",
  /**
   * All forms within the submission were assessed and
   * are no longer pending, at least one form was approved,
   * and the submission process is completed.
   */
  Completed = "Completed",
  /**
   * All forms within the submission were assessed and
   * declined. The submission process is completed.
   * This helps to easily identify submissions where
   * all forms were declined.
   */
  Declined = "Declined",
}
