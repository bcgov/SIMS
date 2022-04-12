/**
 * Possible status for an Assessment, when the Application_status is in Assessment
 */
export enum AssessmentStatus {
  /**
   * An Assessment is required
   */
  required = "Required",
  /**
   * An Assessment is not required, not used in our current workflow but having it as an placeholder
   */
  notRequired = "Not Required",
  /**
   * An Assessment is Completed
   */
  completed = "Completed",
  /**
   * An Assessment is Declined,  not used in our current workflow but having it as an placeholder
   */
  declined = "Declined",
}

/**
 * Assessment History Status
 */
export enum StudentAssessmentStatus {
  // When assessmentWorkflowId is null,
  // then status is Submitted.
  Submitted = "Submitted",

  // When assessmentWorkflowId is not null
  // and assessmentData is null, then status is
  // InProgress.
  InProgress = "In Progress",

  // When assessmentWorkflowId is not null
  // and assessmentData is not null, then status
  // is Completed.
  Completed = "Completed",
}
