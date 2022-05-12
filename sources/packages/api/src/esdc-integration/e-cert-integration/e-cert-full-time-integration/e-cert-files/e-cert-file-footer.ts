import { StringBuilder } from "../../../../utilities/string-builder";
import {
  SPACE_FILLER,
  NUMBER_FILLER,
} from "../../../models/esdc-integration.model";
import { ECertFileFooter } from "../../e-cert-files/e-cert-file-footer";
import {
  ECERT_SENT_TITLE,
  RecordTypeCodes,
} from "../../models/e-cert-integration-model";

/**
 * Footer of a Full-Time E-Cert file.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class ECertFullTimeFileFooter extends ECertFileFooter {
  getFixedFormat(): string {
    const footer = new StringBuilder();
    footer.append(this.recordTypeCode);
    footer.appendWithEndFiller(ECERT_SENT_TITLE, 40, SPACE_FILLER);
    footer.appendWithStartFiller(this.recordCount, 9, NUMBER_FILLER);
    footer.appendWithStartFiller(this.totalSINHash, 15, NUMBER_FILLER);
    footer.repeatAppend(SPACE_FILLER, 733); //Trailing spaces.
    return footer.toString();
  }

  createFromLine(line: string): ECertFullTimeFileFooter {
    const footer = new ECertFullTimeFileFooter();
    footer.recordTypeCode = line.substring(0, 3) as RecordTypeCodes;
    // Here total record count is the total records rejected.
    footer.recordCount = parseInt(line.substring(52, 61));
    footer.totalSINHash = parseInt(line.substring(61, 76));
    return footer;
  }

  getFeedbackFooterRecordType(): RecordTypeCodes {
    return RecordTypeCodes.ECertFullTimeFooter;
  }
}
