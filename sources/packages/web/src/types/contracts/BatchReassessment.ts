/**
 * Overall processing status of a batch manual reassessment submission.
 */
export enum BatchReassessmentStatus {
  Completed = "Completed",
  InProgress = "In progress",
}

/**
 * Outcome of the reassessment of a single application in a batch manual reassessment.
 */
export enum BatchReassessmentApplicationResult {
  Successful = "Successful",
  Failed = "Failed",
  Pending = "Pending",
}
