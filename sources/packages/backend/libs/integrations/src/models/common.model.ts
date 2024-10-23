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
  /**
   * Summary result for child processes.
   */
  children?: ProcessSummaryResult[];
}

/**
 * Full time award types
 */
export enum FullTimeAwardTypes {
  CSLF = "CSLF",
  CSGP = "CSGP",
  CSGD = "CSGD",
  CSGF = "CSGF",
  CSGT = "CSGT",
  BCSL = "BCSL",
  BCAG = "BCAG",
  BGPD = "BGPD",
  SBSD = "SBSD",
}

export enum YNFlag {
  Y = "Y",
  N = "N",
}
