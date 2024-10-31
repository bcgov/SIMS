import {
  DATE_FORMAT,
  NUMBER_FILLER,
  PROVINCE_CODE,
  RecordTypeCodes,
  SPACE_FILLER,
} from "../models/sin-validation-models";
import { getDateOnlyFromFormat, StringBuilder } from "@sims/utilities";
import { FixedFormatFileLine } from "@sims/integrations/services/ssh";

/**
 * Header of an ESDC SIN validation file.
 * Shared between the file send and received.
 * The documentation about it is available on the document 'SIN Check File Layouts 2019.docx'
 */
export class SINValidationFileHeader implements FixedFormatFileLine {
  /**
   * File record type.
   */
  recordTypeCode: RecordTypeCodes;
  /**
   * File sequential number.
   */
  batchNumber: number;
  /**
   * File creation time.
   */
  processDate: Date;

  /**
   * Get the information as a fixed line format to be
   * added to the file uploaded to the SFTP.
   * @returns fixed line formatted.
   */
  getFixedFormat(): string {
    const record = new StringBuilder();
    record.append(this.recordTypeCode);
    record.appendWithStartFiller(this.batchNumber, 6, NUMBER_FILLER);
    record.appendDate(this.processDate, DATE_FORMAT);
    record.append(PROVINCE_CODE);
    record.repeatAppend(SPACE_FILLER, 71);
    return record.toString();
  }

  /**
   * Reads a fixed line format to convert the data.
   * @param line fixed line formatted.
   * @returns file header.
   */
  static createFromFile(line?: string): SINValidationFileHeader {
    const header = new SINValidationFileHeader();
    header.recordTypeCode = line.substring(0, 3) as RecordTypeCodes;
    header.batchNumber = +line.substring(3, 9);
    header.processDate = getDateOnlyFromFormat(
      line.substring(9, 17),
      DATE_FORMAT,
    );
    return header;
  }
}
