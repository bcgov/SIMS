import { RecordTypeCodes } from "../models/sin-validation-model";

/**
 * File response record of an ESDC SIN validation file.
 * The documentation about it is available on the document 'SIN Check File Layouts 2019.docx'
 */
export abstract class SINValidationFileResponse {
  private _recordTypeCode: RecordTypeCodes;
  private _line: string;
  private _lineNumber: number;

  constructor(line: string, lineNumber: number) {
    this._recordTypeCode = line.substring(0, 3) as RecordTypeCodes;
    this._line = line;
    this._lineNumber = lineNumber;
  }

  /**
   * Record type code of the line.
   */
  get recordTypeCode(): RecordTypeCodes {
    return this._recordTypeCode;
  }
  /**
   * Original line read from the SIN validation response file.
   */
  get line(): string {
    return this._line;
  }
  /**
   * Original line number where this record was present
   * in the SIN validation response file. Useful for log.
   */
  get lineNumber(): number {
    return this._lineNumber;
  }
}
