import {
  MSFAARequestFileLine,
  MSFAA_SENT_TITLE,
  NUMBER_FILLER,
  RecordTypeCodes,
  SPACE_FILLER,
} from "../models/msfaa-integration.model";
import { StringBuilder } from "@sims/utilities";

/**
 * Footer of a MSFAA request/response file.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class MSFAAFileFooter implements MSFAARequestFileLine {
  transactionCode: RecordTypeCodes;
  totalSINHash: number;
  recordCount: number;

  public getFixedFormat(): string {
    const footer = new StringBuilder();
    footer.append(this.transactionCode);
    footer.appendWithEndFiller(MSFAA_SENT_TITLE, 40, SPACE_FILLER);
    footer.appendWithStartFiller(this.recordCount.toString(), 9, NUMBER_FILLER);
    footer.appendWithStartFiller(
      this.totalSINHash.toString(),
      15,
      NUMBER_FILLER,
    );
    footer.repeatAppend(SPACE_FILLER, 533); // Filler.
    return footer.toString();
  }

  public static createFromLine(line: string): MSFAAFileFooter {
    const footer = new MSFAAFileFooter();
    footer.transactionCode = line.substring(0, 3) as RecordTypeCodes;
    footer.recordCount = parseInt(line.substring(43, 52));
    footer.totalSINHash = parseInt(line.substring(52, 67));
    return footer;
  }
}
