import { StringBuilder } from "../../utilities/string-builder";
import {
  DATE_FORMAT,
  SPACE_FILLER,
  TransactionCodes,
  TransactionSubCodes,
} from "../cra-integration.models";
import { FixedFormatFileLine } from "../../services/ssh/sftp-integration-base.models";

/**
 * Record of a CRA IV(income verification) request file (0020).
 * Please note that the numbers below (e.g. repeatAppend(SPACE_FILLER, 4))
 * represents the position of the information in a fixed text file format.
 * The documentation about it is available on the document
 * 'Income Verification Data Exchange Technical Guide BC'.
 */
export class CRAFileIVRequestRecord implements FixedFormatFileLine {
  transactionCode: TransactionCodes;
  sin: string;
  individualSurname: string;
  individualGivenName: string;
  individualBirthDate: Date;
  taxYear?: number;
  programAreaCode: string;
  freeProjectArea?: string;

  public getFixedFormat(): string {
    const record = new StringBuilder();
    record.append(this.transactionCode);
    record.append(this.sin, 9);
    record.repeatAppend(SPACE_FILLER, 4);
    record.append(TransactionSubCodes.IVRequest);
    record.appendWithEndFiller(this.individualSurname, 30, SPACE_FILLER);
    // Mononymous names will not have a first name/given name.
    record.appendWithEndFiller(
      this.individualGivenName ?? "",
      30,
      SPACE_FILLER,
    );
    record.appendDate(this.individualBirthDate, DATE_FORMAT);
    record.appendWithEndFiller(
      (this.taxYear ?? "").toString(),
      20,
      SPACE_FILLER,
    );
    record.append(this.programAreaCode);
    record.appendWithEndFiller(this.freeProjectArea ?? "", 30, SPACE_FILLER);
    record.repeatAppend(SPACE_FILLER, 3);
    record.append("0");
    return record.toString();
  }
}
