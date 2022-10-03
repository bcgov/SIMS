import { FixedFormatFileLine } from "../../../services/ssh/sftp-integration-base.models";
import { RecordTypeCodes } from "../models/sin-validation-models";
import {
  DATE_FORMAT,
  SPACE_FILLER,
  NUMBER_FILLER,
} from "../../../esdc-integration/models/esdc-integration.model";
import { StringBuilder } from "../../../utilities";

/**
 * File request record of an ESDC SIN validation file.
 * The documentation about it is available on the document 'SIN Check File Layouts 2019.docx'.
 */
export class SINValidationFileRequest implements FixedFormatFileLine {
  /**
   * Reference id from sims.sin_validations.
   */
  referenceIndex: number;
  /**
   * Social insurance number to be validate.
   */
  sin: string;
  /**
   * First name(a.k.a. given names).
   */
  firstName: string;
  /**
   * Last name.
   */
  lastName: string;
  /**
   * Gender (M=Male, F=Female, O=Other).
   */
  gender: string;
  /**
   * Date of birth.
   */
  birthDate: Date;

  /**
   * Get the information as a fixed line format to be
   * added to the file uploaded to the SFTP.
   * @returns fixed line formatted.
   */
  getFixedFormat(): string {
    const record = new StringBuilder();
    record.append(RecordTypeCodes.Record);
    record.appendWithStartFiller(this.referenceIndex, 9, NUMBER_FILLER); // The documentation shows 10, but PROD records shows that it is 9.
    record.append(this.sin, 9);
    record.appendWithEndFiller(this.firstName ?? "", 30, SPACE_FILLER); // First name can be null due to the mononymous name support.
    record.appendWithEndFiller(this.lastName, 30, SPACE_FILLER);
    record.append(this.gender, 1);
    record.appendDate(this.birthDate, DATE_FORMAT);
    return record.toString();
  }
}
