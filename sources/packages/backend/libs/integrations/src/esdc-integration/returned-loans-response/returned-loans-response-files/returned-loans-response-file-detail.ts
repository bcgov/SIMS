import { ReturnedLoansResponseFileRecord } from "@sims/integrations/esdc-integration/returned-loans-response/returned-loans-response-files/returned-loans-response-file-record";

/**
 * Returned loan response file detail.
 */
export class ReturnedLoansResponseFileDetail extends ReturnedLoansResponseFileRecord {
  constructor(
    readonly line: string,
    readonly lineNumber: number,
  ) {
    super(line);
  }

  /**
   * Customer number - student SIN (Social Insurance Number).
   */
  get sin(): string {
    return this.line.substring(2, 11).trim();
  }
}
