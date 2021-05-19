import { StringBuilder } from "../../../utilities/string-builder";
import {
  DATE_FORMAT,
  SPACE_FILLER,
  TransactionCodes,
  TransactionSubCodes,
} from "../cra-integration.models";
import { CraFileLine } from "./cra-file";

export class CraFileRecord implements CraFileLine {
  transactionCode: TransactionCodes;
  sin: string;
  transactionSubCode: TransactionSubCodes;
  individualSurname: string;
  individualGivenName: string;
  individualBirthDate: Date;
  taxYear?: number;
  programAreaCode: string;
  freeProjectArea?: string;

  public getFixedFormat(): string {
    const record = new StringBuilder();
    record.Append(this.transactionCode);
    record.Append(this.sin);
    record.RepeatAppend(SPACE_FILLER, 4);
    record.Append(this.transactionSubCode);
    record.AppendWithEndFiller(this.individualSurname, 30, SPACE_FILLER);
    record.AppendWithEndFiller(this.individualGivenName, 30, SPACE_FILLER);
    record.AppendDate(this.individualBirthDate, DATE_FORMAT);
    record.AppendWithEndFiller(
      (this.taxYear ?? "").toString(),
      20,
      SPACE_FILLER,
    );
    record.Append(this.programAreaCode);
    record.AppendWithEndFiller(this.freeProjectArea ?? "", 30, SPACE_FILLER);
    record.RepeatAppend(SPACE_FILLER, 3);
    record.Append("0");
    return record.ToString();
  }
}
