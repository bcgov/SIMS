import {
  BatchReassessmentApplicationResult,
  BatchReassessmentStatus,
} from "@/types";

/**
 * Payload used to trigger a batch manual reassessment for a list of application numbers.
 */
export interface BatchReassessmentAPIInDTO {
  applicationNumbers: string[];
  note: string;
}

/**
 * Summary of a batch manual reassessment submission, including how many
 * applications were successfully reassessed, how many failed, and how many
 * are still pending.
 */
export interface BatchReassessmentSummaryAPIOutDTO {
  id: number;
  batchNumber: number;
  createdAt: Date;
  creatorName: string;
  totalCount: number;
  successCount: number;
  failureCount: number;
  pendingCount: number;
  status: BatchReassessmentStatus;
}

/**
 * Outcome of the reassessment of a single application in a batch manual reassessment.
 */
export interface BatchReassessmentApplicationAPIOutDTO {
  applicationNumber: string;
  applicationId?: number;
  studentId?: number;
  result: BatchReassessmentApplicationResult;
  failureReason?: string;
}
