import { ECertResponseRecord } from "../../e-cert-files/e-cert-response-record";

/**
 * Parsing Part-Time E-Certs feedback records to get the document number and associated
 * Error codes.
 * Please note that the numbers below (e.g. line.substring(46, 55))
 * represents the position of the information in a fixed text file format.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class ECertPartTimeResponseRecord extends ECertResponseRecord {
  constructor(line: string, lineNumber: number) {
    super(line, lineNumber);
  }

  /**
   * Financial document number associated with this disbursement.
   */
  get documentNumber(): number {
    return parseInt(this.line.substring(467, 474));
  }

  /**
   * Error code-1 associated with the document number.
   */
  get errorCode1(): string {
    return this.line.substring(732, 742).trim();
  }

  /**
   * Error code-2 associated with the document number.
   */
  get errorCode2(): string {
    return this.line.substring(742, 752).trim();
  }

  /**
   * Error code-3 associated with the document number.
   */
  get errorCode3(): string {
    return this.line.substring(752, 762).trim();
  }

  /**
   * Error code-4 associated with the document number.
   */
  get errorCode4(): string {
    return this.line.substring(762, 772).trim();
  }

  /**
   * Error code-5 associated with the document number.
   */
  get errorCode5(): string {
    return this.line.substring(772, 782).trim();
  }

  /**
   * SIN associated with the document number.
   */
  get sin(): number {
    return parseInt(this.line.substring(46, 55));
  }
}
