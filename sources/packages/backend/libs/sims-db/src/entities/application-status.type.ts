/**
 * Possible status of a Student Application.
 */
export enum ApplicationStatus {
  /**
   * The application is in draft state and is not Submitted.
   */
  Draft = "Draft",
  /**
   * The application has been submitted by the student.
   */
  Submitted = "Submitted",
  /**
   * The application is submitted and Camunda Workflow has been started.
   * This is an overall state for "gathering required information required for assessment"
   * (Eg. PIR/Income Validation/Spouse Information/Parent Information)
   */
  InProgress = "In Progress",
  /**
   * Camunda Workflow completed the assessment.
   * The NOA has been populated and presented to the student for confirmation.
   */
  Assessment = "Assessment",
  /**
   * The NOA has been accepted and the institution needs to confirm enrollment.
   */
  Enrolment = "Enrolment",
  /**
   * The application has been confirmed by the institution.
   */
  Completed = "Completed",
  /**
   * The application has been cancelled by the student.
   */
  Cancelled = "Cancelled",
  /**
   * The application was replaced by a new version due to some event like
   * an edit on Confirmation of Enrollment that forces the assessment to
   * be reevaluated. Is this case the application is cloned and and the
   * old version is marked as 'Overwritten'.
   * An Overwritten application should never be modified, once an application
   * is Overwritten and a clone/new version is created all edits should take
   * place on new record.
   */
  Overwritten = "Overwritten",
}
