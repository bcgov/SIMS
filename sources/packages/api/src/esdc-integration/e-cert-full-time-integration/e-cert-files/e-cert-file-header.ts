import { StringBuilder } from "../../../utilities/string-builder";
import { FixedFormatFileLine } from "../../../services/ssh/sftp-integration-base.models";
import {
  DATE_FORMAT,
  ECERT_SENT_TITLE,
  NUMBER_FILLER,
  RecordTypeCodes,
  SPACE_FILLER,
  TIME_FORMAT,
} from "../models/e-cert-full-time-integration.model";

/**
 * Header of an E-Cert file.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class ECertFileHeader implements FixedFormatFileLine {
  recordTypeCode: RecordTypeCodes;
  processDate: Date;
  originatorCode: string;
  sequence: number;

  public getFixedFormat(): string {
    const header = new StringBuilder();
    header.append(this.recordTypeCode);
    header.appendWithEndFiller(this.originatorCode, 4, SPACE_FILLER);
    header.appendWithEndFiller(ECERT_SENT_TITLE, 40, SPACE_FILLER);
    header.appendDate(this.processDate, DATE_FORMAT);
    header.appendDate(this.processDate, TIME_FORMAT);
    header.appendWithStartFiller(this.sequence.toString(), 6, NUMBER_FILLER);
    header.repeatAppend(SPACE_FILLER, 735); // Trailing space
    return header.toString();
  }
}
