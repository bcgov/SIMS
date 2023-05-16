export class ProcessSummaryResult {
  /**
   * General log for the queue processing.
   */
  summary: string[] = [];
  /**
   * Warnings issues that did not stopped the process from continue.
   */
  warnings: string[] = [];
  /**
   * Errors that did not stopped the process from continue.
   */
  errors: string[] = [];
}
