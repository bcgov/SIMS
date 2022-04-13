import { Injectable } from "@nestjs/common";
import { ECertResponseRecordIdentification } from "../e-cert-response-record-identification";

/**
 * Parsing E-Certs feedback records to get the document number and associated
 * error codes.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
@Injectable()
export class ECertResponseRecord extends ECertResponseRecordIdentification {
  constructor(line: string, lineNumber: number) {
    super(line, lineNumber);
  }

  /**
   * Financial document number associated with this disbursement.
   */
  public get documentNumber(): number {
    throw new Error(`Method not implemented.`);
  }

  /**
   * error code-1 associated with the document number.
   * Index of the first error code is 731 not 641
   * because `Grant Award Code` and `Grant Award Amount`
   * be will repeating 10 times, which is not mentioned
   * in the doc 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
   */
  public get errorCode1(): string {
    throw new Error(`Method not implemented.`);
  }

  /**
   * error code-2 associated with the document number.
   */
  public get errorCode2(): string {
    throw new Error(`Method not implemented.`);
  }

  /**
   * error code-3 associated with the document number.
   */
  public get errorCode3(): string {
    throw new Error(`Method not implemented.`);
  }

  /**
   * error code-4 associated with the document number.
   */
  public get errorCode4(): string {
    throw new Error(`Method not implemented.`);
  }

  /**
   * error code-5 associated with the document number.
   */
  public get errorCode5(): string {
    throw new Error(`Method not implemented.`);
  }

  /**
   * SIN associated with the document number.
   */
  public get sin(): number {
    throw new Error(`Method not implemented.`);
  }
}
