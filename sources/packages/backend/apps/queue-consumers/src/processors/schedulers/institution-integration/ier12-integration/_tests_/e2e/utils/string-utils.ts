import { QueueProcessSummaryResult } from "../../../../../../../processors/models/processors.models";

/**
 * Converts a number to its fixed text format.
 * @param value value to be converted.
 * @param options options.
 * - `length` the fixed length. Default 10.
 * @returns converted text value.
 */
export function numberToText(value: number, length = 10): string {
  return value.toString().padStart(length, "0");
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
