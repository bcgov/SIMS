import { FixedFormatFileLine } from "../../../services/ssh/sftp-integration-base.models";
import { StringBuilder } from "../../../utilities/string-builder";
import {
  ECERT_SENT_TITLE,
  RecordTypeCodes,
  SPACE_FILLER,
} from "../models/e-cert-integration.model";

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
    footer.appendWithStartFiller(this.recordCount.toString(), 9, "0");
    footer.appendWithStartFiller(this.totalSINHash.toString(), 15, "0");
    footer.repeatAppend(SPACE_FILLER, 533); //Trailing spaces
    return footer.toString();
  }
}
