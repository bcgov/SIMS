/**
 * Student assessment status which is dynamically determined
 * with certain logic.
 */
export enum StudentAssessmentStatus {
  /**
   * Student assessment status is considered submitted,
   * when the assessmentWorkflowId is null.
   */
  Submitted = "Submitted",
  /**
   * Student assessment status is considered InProgress,
   * when the assessmentWorkflowId is not null and assessmentData
   * is null.
   */
  InProgress = "In Progress",
  /**
   * Student assessment status is considered Completed,
   * when the assessmentWorkflowId is not null and assessmentData
   * is also not null.
   */
  Completed = "Completed",
}
