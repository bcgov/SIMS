import { Injectable } from "@nestjs/common";
import { ECertResponseRecordIdentification } from "../e-cert-response-record-identification";

/**
 * Parsing E-Certs feedback records to get the document number and associated
 * Error codes.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
@Injectable()
export abstract class ECertResponseRecord extends ECertResponseRecordIdentification {
  constructor(line: string, lineNumber: number) {
    super(line, lineNumber);
  }

  /**
   * Financial document number associated with this disbursement.
   */
  abstract get documentNumber(): number;

  /**
   * Error code-1 associated with the document number.
   */
  abstract get errorCode1(): string;

  /**
   * Error code-2 associated with the document number.
   */
  abstract get errorCode2(): string;

  /**
   * Error code-3 associated with the document number.
   */
  abstract get errorCode3(): string;

  /**
   * Error code-4 associated with the document number.
   */
  abstract get errorCode4(): string;
  /**
   * Error code-5 associated with the document number.
   */
  abstract get errorCode5(): string;

  /**
   * SIN associated with the document number.
   */
  abstract get sin(): number;
}
