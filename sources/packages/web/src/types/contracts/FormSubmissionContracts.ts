/**
 * Defines how forms can be grouped when submitted.
 */
export enum FormSubmissionGrouping {
  /**
   * An application bundle groups multiple forms together
   * as part of a single application process.
   */
  ApplicationBundle = "Application bundle",
  /**
   * A student standalone refers to forms that are submitted
   * independently and are associated directly with a student,
   * rather than an application.
   */
  StudentStandalone = "Student standalone",
}

/**
 * Defines the category of forms.
 */
export enum FormCategory {
  /**
   * Appeals related forms.
   */
  StudentAppeal = "Student appeal",
  /**
   * Any form submitted by a student that does not fall under
   * the appeals process and have multiple applications.
   */
  StudentForm = "Student form",
}

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
}

/**
 * Status of a form submission item (individual decision), indicating whether it is pending,
 * approved, or declined. Each item within a form submission will be assessed individually,
 * and this status reflects the decision for that specific item. A declined item may be part
 * of an approved submission when some other items were approved.
 */
export enum FormSubmissionDecisionStatus {
  /**
   * The form submission item is still pending decision.
   */
  Pending = "Pending",
  /**
   * The form submission item has been approved.
   */
  Approved = "Approved",
  /**
   * The form submission item has been declined.
   */
  Declined = "Declined",
}
