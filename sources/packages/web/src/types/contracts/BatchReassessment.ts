/**
 * Overall processing status of a batch manual reassessment submission.
 */
export enum BatchReassessmentStatus {
  Completed = "Completed",
  InProgress = "In progress",
}

/**
 * Result of the reassessment of an application in a batch manual reassessment.
 */
export enum BatchReassessmentApplicationResult {
  Successful = "Successful",
  Failed = "Failed",
  Pending = "Pending",
}
