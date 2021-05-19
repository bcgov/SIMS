import { StringBuilder } from "../../../utilities/string-builder";
import {
  DATE_FORMAT,
  SPACE_FILLER,
  NUMBER_FILLER,
  TransactionCodes,
} from "../cra-integration.models";
import { CraFileLine } from "./cra-file";

export class CraFileFooter implements CraFileLine {
  transactionCode: TransactionCodes;
  processDate: Date;
  programAreaCode: string;
  environmentCode: string;
  sequence: number;
  recordCount: number;

  public getFixedFormat(): string {
    const header = new StringBuilder();
    header.Append(this.transactionCode);
    header.RepeatAppend(SPACE_FILLER, 24);
    header.AppendDate(this.processDate, DATE_FORMAT);
    header.Append(SPACE_FILLER);
    header.Append(this.programAreaCode);
    header.Append(this.environmentCode);
    header.AppendWithStartFiller(this.sequence.toString(), 5, NUMBER_FILLER);
    header.RepeatAppend(SPACE_FILLER, 11);
    header.AppendWithStartFiller(this.recordCount.toString(), 8, "0");
    header.RepeatAppend(SPACE_FILLER, 80);
    header.Append("0");
    return header.ToString();
  }
}
