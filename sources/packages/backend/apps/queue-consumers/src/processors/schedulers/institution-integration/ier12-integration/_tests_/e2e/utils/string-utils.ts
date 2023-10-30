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
