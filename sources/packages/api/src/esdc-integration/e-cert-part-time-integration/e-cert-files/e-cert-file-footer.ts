import { FixedFormatFileLine } from "../../../services/ssh/sftp-integration-base.models";
import { StringBuilder } from "../../../utilities/string-builder";
import {
  ECERT_SENT_TITLE,
  NUMBER_FILLER,
  RecordTypeCodes,
  SPACE_FILLER,
} from "../models/e-cert-part-time-integration.model";

/**
 * Footer of an E-Cert file.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class ECertFileFooter implements FixedFormatFileLine {
  recordTypeCode: RecordTypeCodes;
  totalSINHash: number;
  recordCount: number;

  public getFixedFormat(): string {
    const footer = new StringBuilder();
    footer.append(this.recordTypeCode);
    footer.appendWithEndFiller(ECERT_SENT_TITLE, 40, SPACE_FILLER);
    footer.appendWithStartFiller(this.recordCount, 9, NUMBER_FILLER);
    footer.appendWithStartFiller(this.totalSINHash, 15, NUMBER_FILLER);
    footer.repeatAppend(SPACE_FILLER, 733); //Trailing spaces
    return footer.toString();
  }

  public static createFromLine(line: string): ECertFileFooter {
    const footer = new ECertFileFooter();
    footer.recordTypeCode = line.substr(0, 3) as RecordTypeCodes;
    // Here total record count is the total records rejected
    footer.recordCount = parseInt(line.substr(52, 9));
    footer.totalSINHash = parseInt(line.substr(61, 15));
    return footer;
  }
}
