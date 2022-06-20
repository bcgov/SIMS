import {
  OkayFlag,
  SINCheckStatus,
} from "../../esdc-integration/sin-validation/models/sin-validation-models";

/**
 * File response record of an ESDC SIN validation file.
 * The documentation about it is available on the document 'SIN Check File Layouts 2019.docx'
 */
export interface SINValidationFileResponse {
  /**
   * Reference id (from sims.sin_validations) sent to the ESDC
   * when the SIN validation request was created(REFERENCE_IDX).
   */
  referenceIndex: number;
  /**
   * Define the SIN validation status(SIN_CHECK_STATUS).
   */
  sinCheckStatus: SINCheckStatus;
  /**
   * SIN status in the overall validation(SIN_OKAY_FLG).
   */
  sinOkayFlag: OkayFlag;
  /**
   * Social insurance number. Used for hash calculation on the received file.
   */
  sin: string;
  /**
   * Date of birth status in the overall validation(DOB_OKAY_FLG).
   */
  birthDateOkayFlag: OkayFlag;
  /**
   * First name status in the overall validation(FIRST_NAME_OKAY_FLG).
   */
  firstNameOkayFlag: OkayFlag;
  /**
   * Last name status in the overall validation(LAST_NAME_OKAY_FLG).
   */
  lastNameOkayFlag: OkayFlag;
  /**
   * Gender status in the overall validation(GENDER_OKAY_FLG).
   */
  genderOkayFlag: OkayFlag;
}
