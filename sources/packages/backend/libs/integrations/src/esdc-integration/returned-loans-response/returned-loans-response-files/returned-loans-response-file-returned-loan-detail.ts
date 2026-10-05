import { ReturnedLoansResponseFileDetail } from "@sims/integrations/esdc-integration/returned-loans-response/returned-loans-response-files/returned-loans-response-file-detail";

/**
 * Returned loan response file detail.
 */
export class ReturnedLoansResponseFileReturnedLoanDetail extends ReturnedLoansResponseFileDetail {
  constructor(
    readonly line: string,
    readonly lineNumber: number,
  ) {
    super(line, lineNumber);
  }

  /**
   * Return reason.
   */
  get returnReason(): string {
    return this.line.substring(83, 87).trim();
  }
}
