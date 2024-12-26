import { formatDate } from "@sims/utilities";

/**
 * Converts a number to its fixed text format.
 * @param value value to be converted.
 * @param options options.
 * - `length` the fixed length. Default 10.
 * @returns converted text value.
 */
export function numberToText(
  value: number,
  options?: { length: number },
): string {
  return value.toString().padStart(options?.length ?? 10, "0");
}

/**
 * Converts a date to its fixed date-only text format.
 * @param date date to be converted.
 * @returns converted data as a string formatted as YYYYMMDD.
 */
export function dateToDateOnlyText(date: Date | string): string {
  return formatDate(date, "YYYYMMDD");
}

/**
 * Get the success string message when a file is uploaded with success.
 * @param timestamp file timestamp.
 * @param options options.
 * - `expectedRecords`: number of expected records in the file. If not
 * provided default value will be 1.
 * @returns success summary result.
 */
export function getSuccessSummaryMessages(
  timestamp: string,
  options: {
    institutionCode: string;
    expectedRecords?: number;
  },
): string {
  return `Uploaded file ${process.env.INSTITUTION_REQUEST_FOLDER}\\${
    options.institutionCode
  }\\${options.institutionCode}-IER12-${timestamp}.txt, with ${
    options.expectedRecords ?? 1
  } record(s).`;
}
