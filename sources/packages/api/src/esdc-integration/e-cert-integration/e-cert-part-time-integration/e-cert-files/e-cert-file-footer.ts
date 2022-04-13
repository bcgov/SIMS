import { StringBuilder } from "../../../../utilities/string-builder";
import { RecordTypeCodes } from "../../models/e-cert-integration-model";
import {
  SPACE_FILLER,
  NUMBER_FILLER,
} from "../../../models/esdc-integration.model";
import { ECertFileFooter } from "../../e-cert-files/e-cert-file-footer";

/**
 * Footer of an E-Cert file.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class ECertPartTimeFileFooter implements ECertFileFooter {
  recordTypeCode: RecordTypeCodes;
  totalAmountDisbursed: number;
  totalSINHash: number;
  recordCount: number;

  public getFixedFormat(): string {
    const footer = new StringBuilder();
    footer.append(this.recordTypeCode);
    footer.appendWithStartFiller(this.recordCount, 9, NUMBER_FILLER);
    footer.appendWithStartFiller(this.totalAmountDisbursed, 15, NUMBER_FILLER);
    footer.repeatAppend(SPACE_FILLER, 730); //Trailing spaces.
    return footer.toString();
  }

  public createFromLine(line: string): ECertPartTimeFileFooter {
    const footer = new ECertPartTimeFileFooter();
    footer.recordTypeCode = line.substring(0, 2) as RecordTypeCodes;
    // Here total record count is the total records.
    footer.recordCount = parseInt(line.substring(2, 11));
    footer.totalSINHash = parseInt(line.substring(11, 26));
    return footer;
  }
}
