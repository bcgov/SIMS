import { StringBuilder } from "../../utilities/string-builder";
import {
  DATE_FORMAT,
  SPACE_FILLER,
  NUMBER_FILLER,
  TransactionCodes,
} from "../cra-integration.models";
import { CRAFileLine } from "./cra-file";

/**
 * Header of a CRA request/response file.
 */
export class CRAFileHeader implements CRAFileLine {
  transactionCode: TransactionCodes;
  processDate: Date;
  programAreaCode: string;
  environmentCode: string;
  sequence: number;

  public getFixedFormat(): string {
    const header = new StringBuilder();
    header.append(this.transactionCode);
    header.repeatAppend(SPACE_FILLER, 24);
    header.appendDate(this.processDate, DATE_FORMAT);
    header.append(SPACE_FILLER);
    header.append(this.programAreaCode);
    header.append(this.environmentCode);
    header.appendWithStartFiller(this.sequence.toString(), 5, NUMBER_FILLER);
    header.repeatAppend(SPACE_FILLER, 99);
    header.append("0");
    return header.toString();
  }
}
