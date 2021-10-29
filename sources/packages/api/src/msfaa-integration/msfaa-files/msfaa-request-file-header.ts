import { StringBuilder } from "../../utilities/string-builder";
import {
  DATE_FORMAT,
  MSFAARequestFileLine,
  MSFAA_SENT_TITLE,
  SPACE_FILLER,
  TIME_FORMAT,
  TransactionCodes,
} from "../models/msfaa-integration.model";

/**
 * Header of a CRA request/response file.
 * Please note that the numbers below (e.g. repeatAppend(SPACE_FILLER, 99))
 * represents the position of the information in a fixed text file format.
 * The documentation about it is available on the document
 * 'Income Verification Data Exchange Technical Guide BC'.
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
}
