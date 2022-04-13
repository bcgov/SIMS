import { ECertResponseRecordIdentification } from "../../e-cert-part-time-integration/e-cert-files/e-cert-response-record-identification";

/**
 * Parsing E-Certs feedback records to get the document number and associated
 * error codes
 * Please note that the numbers below (e.g. line.substr(25, 2))
 * represents the position of the information in a fixed text file format.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class ECertResponseRecord extends ECertResponseRecordIdentification {
  constructor(line: string, lineNumber: number) {
    super(line, lineNumber);
  }

  /**
   * Financial document number associated with this disbursement.
   */
  public get documentNumber(): number {
    return parseInt(this.line.substring(31, 39));
  }

  /**
   * error code-1 associated with the document number.
   * Index of the first error code is 731 not 641
   * because `Grant Award Code` and `Grant Award Amount`
   * be will repeating 10 times, which is not mentioned
   * in the doc 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
   */
  public get errorCode1(): string {
    return this.line.substring(731, 741).trim();
  }

  /**
   * error code-2 associated with the document number.
   */
  public get errorCode2(): string {
    return this.line.substring(741, 751).trim();
  }

  /**
   * error code-3 associated with the document number.
   */
  public get errorCode3(): string {
    return this.line.substring(751, 761).trim();
  }

  /**
   * error code-4 associated with the document number.
   */
  public get errorCode4(): string {
    return this.line.substring(761, 771).trim();
  }

  /**
   * error code-5 associated with the document number.
   */
  public get errorCode5(): string {
    return this.line.substring(771, 781).trim();
  }

  /**
   * SIN associated with the document number.
   */
  public get sin(): number {
    return parseInt(this.line.substring(3, 12));
  }
}
