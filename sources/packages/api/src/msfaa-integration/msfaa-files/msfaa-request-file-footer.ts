import { StringBuilder } from "../../utilities/string-builder";
import {
  MSFAARequestFileLine,
  MSFAA_SENT_TITLE,
  SPACE_FILLER,
  TransactionCodes,
} from "../models/msfaa-integration.model";

/**
 * Footer of a MSFAA request/response file.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class MSFAAFileFooter implements MSFAARequestFileLine {
  transactionCode: TransactionCodes;
  totalSINHash: number;
  recordCount: number;

  public getFixedFormat(): string {
    const header = new StringBuilder();
    header.append(this.transactionCode);
    header.appendWithEndFiller(MSFAA_SENT_TITLE, 40, SPACE_FILLER);
    header.appendWithStartFiller(this.recordCount.toString(), 9, "0");
    header.appendWithStartFiller(this.totalSINHash.toString(), 15, "0");
    header.repeatAppend(SPACE_FILLER, 533); //Trailing spaces
    return header.toString();
  }
}
