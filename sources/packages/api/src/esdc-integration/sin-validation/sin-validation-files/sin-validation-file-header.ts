import { FixedFormatFileLine } from "../../../services/ssh/sftp-integration-base.models";
import { RecordTypeCodes } from "../models/sin-validation-model";

/**
 * Header of an ESDC SIN validation file.
 * The documentation about it is available on the document 'SIN Check File Layouts 2019.docx'
 */
export abstract class SINValidationFileHeader implements FixedFormatFileLine {
  recordTypeCode: RecordTypeCodes;
  processDate: Date;
  sequence: number;

  getFixedFormat(): string {
    // TODO: TO be implemented.
    return "";
  }

  createFromLine(line: string): SINValidationFileHeader {
    // TODO: TO be implemented.
    return null;
  }
}
