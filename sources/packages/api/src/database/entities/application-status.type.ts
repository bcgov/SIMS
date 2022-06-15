/**
 * Possible status of a Student Application.
 */
export enum ApplicationStatus {
  /**
   * The application is in draft state and is not Submitted.
   */
  draft = "Draft",
  /**
   * The application has been submitted by the student.
   */
  submitted = "Submitted",
  /**
   * The application is submitted and Camunda Workflow has been started.
   * This is an overall state for "gathering required information required for assessment"
   * (Eg. PIR/Income Validation/Spouse Information/Parent Information)
   */
  inProgress = "In Progress",
  /**
   * Camunda Workflow completed the assessment.
   * The NOA has been populated and presented to the student for confirmation.
   */
  assessment = "Assessment",
  /**
   * The NOA has been accepted and the institution needs to confirm enrollment.
   */
  enrollment = "Enrollment",
  /**
   * The application has been confirmed by the institution.
   */
  completed = "Completed",
  /**
   * The application has been cancelled by the student.
   */
  cancelled = "Cancelled",
  /**
   * The application was replaced by a new version due to some event like
   * an edit on Confirmation of Enrollment that forces the assessment to
   * be reevaluated. Is this case the application is cloned and and the
   * old version is marked as 'Overwritten'.
   * An Overwritten application should never be modified, once an application
   * is Overwritten and a clone/new version is created all edits should take
   * place on new record.
   */
  overwritten = "Overwritten",
  /**
   * Applications that are completed and not archived.
   */
  available = "Available",
  /**
   * Applications that are completed and archived.
   */
  unavailable = "Unavailable",
}
