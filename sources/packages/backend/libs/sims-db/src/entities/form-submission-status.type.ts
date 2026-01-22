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
   * are no longer pending. The decisions could be
   * approved or declined, either way the submission
   * process is completed.
   */
  Completed = "Completed",
  /**
   * None of the forms within the submission were approved.
   * The submission process is completed, but this entire
   * submission was declined and can have its actions ignored.
   */
  Declined = "Declined",
}
