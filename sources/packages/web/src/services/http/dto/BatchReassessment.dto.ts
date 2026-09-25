export const BATCH_REASSESSMENT_MAX_APPLICATION_NUMBERS = 50000;

/**
 * Payload used to trigger a batch manual reassessment for a list of application numbers.
 */
export interface BatchReassessmentAPIInDTO {
  applicationNumbers: string[];
  note: string;
}

/**
 * Overall processing status of a batch manual reassessment submission.
 */
export enum BatchReassessmentStatus {
  Completed = "Completed",
  InProgress = "In progress",
}

/**
 * Summary of a batch manual reassessment submission, including how many
 * applications were successfully reassessed and how many failed.
 */
export interface BatchReassessmentSummaryAPIOutDTO {
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
