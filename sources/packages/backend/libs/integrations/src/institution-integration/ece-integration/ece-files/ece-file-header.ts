import {
  DATE_FORMAT,
  ECE_SENT_TITLE,
  RecordTypeCodes,
  SPACE_FILLER,
} from "../models/ece-integration.model";
import { StringBuilder } from "@sims/utilities";
import { ECERequestFileLine } from "./ece-file-line";

const ORIGINATOR_CODE = "SSB";

/**
 * Header of a ECE request file.
 * The documentation about it is available on the document
 * 'SIMSSFAS - Institution File layouts In Analysis Folder'.
 */
export class ECEFileHeader implements ECERequestFileLine {
  recordTypeCode: RecordTypeCodes;
  processDate: Date;

  getFixedFormat(): string {
    const header = new StringBuilder();
    header.append(this.recordTypeCode);
    header.appendWithEndFiller(ORIGINATOR_CODE, 4, SPACE_FILLER);
    header.appendWithEndFiller(ECE_SENT_TITLE, 20, SPACE_FILLER);
    header.appendDate(this.processDate, DATE_FORMAT);
    return header.toString();
  }
}
