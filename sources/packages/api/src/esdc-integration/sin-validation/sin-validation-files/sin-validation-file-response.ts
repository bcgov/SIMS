import {
  RecordTypeCodes,
  SINCheckStatus,
  OkayFlag,
} from "../models/sin-validation-models";

/**
 * File response record of an ESDC SIN validation file.
 * The documentation about it is available on the document 'SIN Check File Layouts 2019.docx'
 */
export class SINValidationFileResponse {
  private _line: string;
  private _lineNumber: number;

  constructor(line: string, lineNumber: number) {
    this._line = line;
    this._lineNumber = lineNumber;
  }

  /**
   * Record type code of the line.
   */
  get recordTypeCode(): RecordTypeCodes {
    return this._line.substring(0, 3) as RecordTypeCodes;
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
  /**
   * Reference id (from sims.sin_validations) sent to the ESDC
   * when the SIN validation request was created(REFERENCE_IDX).
   */
  get referenceIndex(): number {
    return +this.line.substring(3, 13);
  }
  /**
   * Social insurance number. Used for hash calculation on the received file.
   */
  get sin(): string {
    return this.line.substring(14, 23);
  }
  /**
   * Define the SIN validation status(SIN_CHECK_STATUS).
   */
  get sinCheckStatus(): SINCheckStatus {
    return +this.line.substring(12, 13);
  }
  /**
   * SIN status in the overall validation(SIN_OKAY_FLG).
   */
  get sinOkayFlag(): OkayFlag {
    return this.line.substring(13, 14) as OkayFlag;
  }
  /**
   * Date of birth status in the overall validation(DOB_OKAY_FLG).
   */
  get dateOfBirthOkayFlag(): OkayFlag {
    return this.line.substring(23, 24) as OkayFlag;
  }
  /**
   * First name status in the overall validation(FIRST_NAME_OKAY_FLG).
   */
  get firstNameOkayFlag(): OkayFlag {
    return this.line.substring(24, 25) as OkayFlag;
  }
  /**
   * Last name status in the overall validation(LAST_NAME_OKAY_FLG).
   */
  get lastNameOkayFlag(): OkayFlag {
    return this.line.substring(25, 26) as OkayFlag;
  }
  /**
   * Gender status in the overall validation(GENDER_OKAY_FLG).
   */
  get genderOkayFlag(): OkayFlag {
    return this.line.substring(26, 27) as OkayFlag;
  }
}
