import { StringBuilder } from "../../../utilities";
import {
  NUMBER_FILLER,
  SPACE_FILLER,
} from "../../../esdc-integration/models/esdc-integration.model";
import { FixedFormatFileLine } from "../../../services/ssh/sftp-integration-base.models";
import { RecordTypeCodes } from "../models/sin-validation-models";

/**
 * Footer of an ESDC SIN validation file.
 * Shared between the file send and received.
 * The documentation about it is available on the document 'SIN Check File Layouts 2019.docx'
 */
export class SINValidationFileFooter implements FixedFormatFileLine {
  /**
   * File record type.
   */
  recordTypeCode: RecordTypeCodes;
  /**
   * Total records in the file (dos not include header and footer).
   */
  recordCount: number;
  /**
   * Sum of all the SIN presents in the file.
   */
  totalSINHash: number;

  /**
   * Get the information as a fixed line format to be
   * added to the file uploaded to the SFTP.
   * @returns fixed line formatted.
   */
  getFixedFormat(): string {
    const record = new StringBuilder();
    record.append(this.recordTypeCode);
    record.appendWithStartFiller(this.recordCount, 6, NUMBER_FILLER);
    record.appendWithStartFiller(this.totalSINHash, 15, NUMBER_FILLER);
    record.repeatAppend(SPACE_FILLER, 66);
    return record.toString();
  }

  /**
   * Reads a fixed line format to convert the data.
   * @param line fixed line formatted.
   * @returns file footer.
   */
  static createFromLine(line: string): SINValidationFileFooter {
    const footer = new SINValidationFileFooter();
    footer.recordTypeCode = line.substring(0, 3) as RecordTypeCodes;
    footer.recordCount = +line.substring(3, 9);
    footer.totalSINHash = +line.substring(9, 24);
    return footer;
  }
}
