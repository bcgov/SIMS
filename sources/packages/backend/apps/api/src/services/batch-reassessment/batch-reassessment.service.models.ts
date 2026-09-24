import { BatchReassessmentStatus } from "@sims/sims-db";

/**
 * Summary of the results of a Batch reassessment.
 */
export interface BatchReassessmentSummary {
  id: number;
  batchNumber: number;
  createdAt: Date;
  creatorFirstName: string;
  creatorLastName: string;
  successCount: number;
  failureCount: number;
  status: BatchReassessmentStatus;
}
