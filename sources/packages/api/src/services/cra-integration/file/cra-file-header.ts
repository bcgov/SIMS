import { StringBuilder } from "../../../utilities/string-builder";
import {
  DATE_FORMAT,
  FILLER,
  TransactionCodes,
} from "../cra-integration.models";
import { CraFileLine } from "./cra-file";

export class CraFileHeader implements CraFileLine {
  transactionCode: TransactionCodes;
  processDate: Date;
  programAreaCode: string;
  environmentCode: string;
  sequence: number;

  public getFixedFormat(): string {
    const header = new StringBuilder();
    header.Append(this.transactionCode);
    header.RepeatAppend(FILLER, 24);
    header.AppendDate(this.processDate, DATE_FORMAT);
    header.Append(FILLER);
    header.Append(this.programAreaCode);
    header.Append(this.environmentCode);
    header.RepeatAppend(FILLER, 99);
    header.Append("0");
    console.log(header.ToString());
    return header.ToString();
  }
}
