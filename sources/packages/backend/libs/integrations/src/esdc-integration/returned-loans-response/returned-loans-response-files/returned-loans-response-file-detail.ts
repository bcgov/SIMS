import { ReturnedLoansResponseFileRecord } from "@sims/integrations/esdc-integration/returned-loans-response/returned-loans-response-files/returned-loans-response-file-record";

/**
 * Returned loan response file detail.
 */
export abstract class ReturnedLoansResponseFileDetail extends ReturnedLoansResponseFileRecord {
  constructor(
    protected readonly line: string,
    protected readonly _lineNumber: number,
  ) {
    super(line);
  }

  /**
   * Line number of the detail record in the response file.
   */
  get lineNumber(): number {
    return this._lineNumber;
  }

  /**
   * Customer number - student SIN (Social Insurance Number).
   */
  get sin(): string {
    return this.line.substring(2, 11).trim();
  }
}
