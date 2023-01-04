import {
  ECERequestFileLine,
  RecordTypeCodes,
} from "../models/ece-integration.model";
import { StringBuilder } from "@sims/utilities";

/**
 * Footer of a ECE request file.
 * The documentation about it is available on the document
 * 'SIMSSFAS - Institution File layouts In Analysis Folder'.
 */
export class ECEFileFooter implements ECERequestFileLine {
  transactionCode: RecordTypeCodes;
  recordCount: number;

  public getFixedFormat(): string {
    const footer = new StringBuilder();
    footer.append(this.transactionCode);
    footer.appendWithStartFiller(this.recordCount.toString(), 6, "0");
    return footer.toString();
  }
}
