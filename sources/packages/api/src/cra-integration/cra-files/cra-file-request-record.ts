import { StringBuilder } from "../../utilities/string-builder";
import {
  DATE_FORMAT,
  SPACE_FILLER,
  TransactionCodes,
  TransactionSubCodes,
} from "../cra-integration.models";
import { CRARequestFileLine } from "./cra-file";

/**
 * Record of a CRA request file (0020).
 */
export class CRAFileIVRequestRecord implements CRARequestFileLine {
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
