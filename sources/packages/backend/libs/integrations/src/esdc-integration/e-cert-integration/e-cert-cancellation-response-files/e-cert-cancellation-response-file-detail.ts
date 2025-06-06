import { ECertCancellationResponseFileRecord } from "./e-cert-cancellation-response-file-record";

/**
 * E-Cert cancellation response file detail.
 */
export class ECertCancellationResponseFileDetail extends ECertCancellationResponseFileRecord {
  constructor(line: string, private readonly _lineNumber: number) {
    super(line);
  }

  /**
   * Line number of the detail record in the response file.
   */
  get lineNumber(): number {
    return this._lineNumber;
  }

  /**
   * Disbursement document number(Integrated e-cert number).
   */
  get documentNumber(): number {
    return parseInt(this.line.substring(4, 13));
  }
}
