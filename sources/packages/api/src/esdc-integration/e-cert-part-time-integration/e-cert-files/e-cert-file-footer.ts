import { FixedFormatFileLine } from "../../../services/ssh/sftp-integration-base.models";
import { StringBuilder } from "../../../utilities/string-builder";
import {
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
  totalAmountDisbursed: number;
  recordCount: number;

  public getFixedFormat(): string {
    const footer = new StringBuilder();
    footer.append(this.recordTypeCode);
    footer.appendWithStartFiller(this.recordCount, 9, NUMBER_FILLER);
    footer.appendWithStartFiller(this.totalAmountDisbursed, 15, NUMBER_FILLER);
    footer.repeatAppend(SPACE_FILLER, 730); //Trailing spaces
    return footer.toString();
  }

  public static createFromLine(line: string): ECertFileFooter {
    const footer = new ECertFileFooter();
    footer.recordTypeCode = line.substring(0, 2) as RecordTypeCodes;
    // Here total record count is the total records
    footer.recordCount = parseInt(line.substring(2, 11));
    footer.totalAmountDisbursed = parseInt(line.substring(11, 26));
    return footer;
  }
}
