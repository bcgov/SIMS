import { BatchReassessmentStatus } from "@/types";

/**
 * Payload used to trigger a batch manual reassessment for a list of application numbers.
 */
export interface BatchReassessmentAPIInDTO {
  applicationNumbers: string[];
  note: string;
}

/**
 * Summary of a batch manual reassessment submission, including how many
 * applications were successfully reassessed and how many failed.
 */
export interface BatchReassessmentSummaryAPIOutDTO {
  id: number;
  batchNumber: number;
  createdAt: Date;
  creatorName: string;
  totalCount: number;
  successCount: number;
  failureCount: number;
  status: BatchReassessmentStatus;
}
