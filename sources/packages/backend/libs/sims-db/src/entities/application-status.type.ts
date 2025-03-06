/**
 * Possible status of a Student Application.
 * Applications with the same parent ID can have multiple edited versions and only one of its versions
 * should have a status other than 'Edited', which represents its current state.
 * Edited applications waiting for the Ministry approval are not considered 'current' till approved.
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
   * The application was modified in some way and a new version was created.
   * This can happen when a student edits an application prior to COE confirmation or
   * when a change request is made by the student (after COE approval) and is approved by the Ministry.
   */
  Edited = "Edited",
}
