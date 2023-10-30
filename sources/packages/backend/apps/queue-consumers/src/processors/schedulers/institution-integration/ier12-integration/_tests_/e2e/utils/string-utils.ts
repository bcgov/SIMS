import { QueueProcessSummaryResult } from "../../../../../../../processors/models/processors.models";
/**
 * Converts an assessment id to its fixed text format.
 * @param assessmentId assessment id to be converted.
 * @returns converted assessment id.
 */
export function assessmentIdToText(assessmentId: number): string {
  return assessmentId.toString().padStart(10, "0");
}

/**
 * Converts a disbursement id id to its fixed text format.
 * @param disbursementId disbursement id to be converted.
 * @returns converted disbursement id.
 */
export function disbursementIdToText(disbursementId: number): string {
  return disbursementId.toString().padStart(10, "0");
}

/**
 * Get the success string messages when a file is uploaded with success.
 * @param timestamp file timestamp.
 * @param options options.
 * - `expectedRecords`: number of expected records in the file. If not
 * provided default value will be 1.
 * @returns success summary result.
 */
export function getSuccessSummaryMessages(
  timestamp: string,
  options?: {
    expectedRecords?: number;
  },
): QueueProcessSummaryResult {
  return {
    summary: [
      `The uploaded file: ${process.env.INSTITUTION_REQUEST_FOLDER}\\ZZZY\\IER_012_${timestamp}.txt`,
      `The number of records: ${options?.expectedRecords ?? 1}`,
    ],
  } as QueueProcessSummaryResult;
}
