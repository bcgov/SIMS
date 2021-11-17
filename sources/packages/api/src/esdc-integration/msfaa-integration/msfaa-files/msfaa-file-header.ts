import {
  DATE_FORMAT,
  MSFAARequestFileLine,
  MSFAA_SENT_TITLE,
  SPACE_FILLER,
  TIME_FORMAT,
  TransactionCodes,
} from "../models/msfaa-integration.model";
import { StringBuilder, getDateOnlyFromFormat } from "../../../utilities";

/**
 * Header of a MSFAA request file.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class MSFAAFileHeader implements MSFAARequestFileLine {
  transactionCode: TransactionCodes;
  processDate: Date;
  provinceCode: string;
  environmentCode: string;
  sequence: number;

  public getFixedFormat(): string {
    const header = new StringBuilder();
    header.append(this.transactionCode);
    header.appendWithEndFiller(this.provinceCode, 4, SPACE_FILLER);
    header.appendWithEndFiller(MSFAA_SENT_TITLE, 40, SPACE_FILLER);
    header.appendDate(this.processDate, DATE_FORMAT);
    header.appendDate(this.processDate, TIME_FORMAT);
    header.appendWithStartFiller(this.sequence.toString(), 6, "0");
    header.repeatAppend(SPACE_FILLER, 535); // Trailing space
    return header.toString();
  }

  public static createFromLine(line: string): MSFAAFileHeader {
    const header = new MSFAAFileHeader();
    header.transactionCode = line.substr(0, 3) as TransactionCodes;
    header.processDate = getDateOnlyFromFormat(line.substr(47, 8), DATE_FORMAT);
    return header;
  }
}
