export enum FormSubmissionCancellationReason {
  /**
   * Form submission was cancelled due to student application edit.
   */
  ApplicationEdited = "Application edited",
  /**
   * Form submission was cancelled due to student application cancellation.
   */
  ApplicationCancelled = "Application cancelled",
  /**
   * Form submission was cancelled by the student.
   */
  StudentCancelledSubmission = "Student cancelled submission",
}
