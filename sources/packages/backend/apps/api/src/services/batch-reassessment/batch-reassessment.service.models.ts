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
  pendingCount: number;
  status: BatchReassessmentStatus;
}

/**
 * Outcome of the reassessment of a single application in a batch manual reassessment.
 */
export enum BatchReassessmentApplicationResult {
  /**
   * The application was reassessed and the assessment reached a final status.
   */
  Successful = "Successful",
  /**
   * The application could not be reassessed.
   */
  Failed = "Failed",
  /**
   * The application was reassessed and the assessment is still being processed.
   */
  Pending = "Pending",
}

/**
 * Outcome of a single application included in a batch manual reassessment.
 */
export interface BatchReassessmentApplicationOutcome {
  applicationNumber: string;
  applicationId?: number;
  studentId?: number;
  result: BatchReassessmentApplicationResult;
  failureReason?: string;
}
