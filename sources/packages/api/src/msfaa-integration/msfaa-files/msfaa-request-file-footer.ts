import { SPACE_FILLER } from "src/cra-integration/cra-integration.models";
import { StringBuilder } from "../../utilities/string-builder";
import {
  MSFAARequestFileLine,
  MSFAA_SENT_TITLE,
  TransactionCodes,
} from "../models/msfaa-integration.model";

/**
 * Footer of a CRA request/response file.
 * Please note that the numbers below (e.g. repeatAppend(SPACE_FILLER, 6))
 * represents the position of the information in a fixed text file format.
 * The documentation about it is available on the document
 * 'Income Verification Data Exchange Technical Guide BC'.
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
