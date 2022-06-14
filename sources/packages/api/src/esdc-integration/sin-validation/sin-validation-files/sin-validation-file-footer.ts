import { FixedFormatFileLine } from "../../../services/ssh/sftp-integration-base.models";
import { RecordTypeCodes } from "../models/sin-validation-model";

/**
 * Footer of an ESDC SIN validation file.
 * The documentation about it is available on the document 'SIN Check File Layouts 2019.docx'
 */
export abstract class SINValidationFileFooter implements FixedFormatFileLine {
  recordTypeCode: RecordTypeCodes;
  totalSINHash: number;
  recordCount: number;

  getFixedFormat(): string {
    // TODO: TO be implemented.
    return "";
  }

  createFromLine(line: string): SINValidationFileFooter {
    // TODO: TO be implemented.
    return null;
  }
}
