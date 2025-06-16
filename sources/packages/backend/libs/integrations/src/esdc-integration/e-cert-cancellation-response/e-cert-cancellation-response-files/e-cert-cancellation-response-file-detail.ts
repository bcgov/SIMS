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
   * The last character of a document number is always a space, so we trim it.
   * The first 8 contains numbers with leading zeros.
   */
  get documentNumber(): number {
    return parseInt(this.line.substring(3, 12).trim());
  }
}
