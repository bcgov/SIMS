/**
 * Processing status of a batch manual reassessment submission.
 */
export enum BatchReassessmentStatus {
  /**
   * The batch manual reassessment processing has completed.
   */
  Completed = "Completed",
  /**
   * The batch manual reassessment processing is in progress.
   */
  InProgress = "In progress",
}

/**
 * Summary of the results of a Batch reassessment.
 */
export interface BatchReassessmentSummary {
  id: number;
  batchNumber: number;
  createdAt: Date;
  creatorFirstName: string;
  creatorLastName: string;
  totalCount: number;
  successCount: number;
  failureCount: number;
  status: BatchReassessmentStatus;
}
