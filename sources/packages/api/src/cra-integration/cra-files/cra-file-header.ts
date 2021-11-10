import { getDateOnlyFromFormat } from "../../utilities";
import { StringBuilder } from "../../utilities/string-builder";
import {
  DATE_FORMAT,
  SPACE_FILLER,
  NUMBER_FILLER,
  TransactionCodes,
} from "../cra-integration.models";
import { FixedFormatFileLine } from "../../services/ssh/sftp-integration-base.models";

/**
 * Header of a CRA request/response file.
 * Please note that the numbers below (e.g. repeatAppend(SPACE_FILLER, 99))
 * represents the position of the information in a fixed text file format.
 * The documentation about it is available on the document
 * 'Income Verification Data Exchange Technical Guide BC'.
 */
export class CRAFileHeader implements FixedFormatFileLine {
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

  public static createFromLine(line: string): CRAFileHeader {
    const header = new CRAFileHeader();
    header.transactionCode = line.substr(0, 4) as TransactionCodes;
    header.processDate = getDateOnlyFromFormat(line.substr(28, 8), DATE_FORMAT);
    header.programAreaCode = line.substr(37, 4);
    header.environmentCode = line.substr(41, 1);
    header.sequence = parseInt(line.substr(42, 5));
    return header;
  }
}
