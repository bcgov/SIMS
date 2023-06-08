/**
 * Common result summary model for file processing.
 */
export class ProcessSummaryResult {
  /**
   * Summary details of the processing.
   */
  summary: string[] = [];
  /**
   * Warnings issues that did not stopped the process from continue.
   */
  warnings: string[] = [];
  /**
   * Errors that happened during the file processing.
   */
  errors: string[] = [];
}

/**
 * Single character Yes | No option.
 */
export enum YNOptions {
  Y = "Y",
  N = "N",
}
