import { FixedFormatFileLine } from "../../services/ssh/sftp-integration-base.models";
import { StringBuilder } from "../../utilities/string-builder";
import {
  ECERT_SENT_TITLE,
  SPACE_FILLER,
  TransactionCodes,
} from "../models/e-cert-integration.model";

/**
 * Footer of a MSFAA request/response file.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class ECertFileFooter implements FixedFormatFileLine {
  transactionCode: TransactionCodes;
  totalSINHash: number;
  recordCount: number;

  public getFixedFormat(): string {
    const footer = new StringBuilder();
    footer.append(this.transactionCode);
    footer.appendWithEndFiller(ECERT_SENT_TITLE, 40, SPACE_FILLER);
    footer.appendWithStartFiller(this.recordCount.toString(), 9, "0");
    footer.appendWithStartFiller(this.totalSINHash.toString(), 15, "0");
    footer.repeatAppend(SPACE_FILLER, 533); //Trailing spaces
    return footer.toString();
  }

  public static createFromLine(line: string): ECertFileFooter {
    const footer = new ECertFileFooter();
    footer.transactionCode = line.substr(0, 3) as TransactionCodes;
    footer.recordCount = parseInt(line.substr(43, 9));
    footer.totalSINHash = parseInt(line.substr(52, 15));
    return footer;
  }
}
