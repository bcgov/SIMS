import { StringBuilder, getDateOnlyFromFormat } from "../../../../utilities";
import {
  ECERT_SENT_TITLE,
  RecordTypeCodes,
} from "../../models/e-cert-integration-model";
import {
  DATE_FORMAT,
  SPACE_FILLER,
  NUMBER_FILLER,
  TIME_FORMAT,
} from "../../../models/esdc-integration.model";
import { ECertFileHeader } from "../../e-cert-files/e-cert-file-header";

const ORIGINATOR_CODE = "BC";

/**
 * Header of a Full-Time E-Cert file.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class ECertFullTimeFileHeader extends ECertFileHeader {
  public getFixedFormat(): string {
    const header = new StringBuilder();
    header.append(this.recordTypeCode);
    header.appendWithEndFiller(ORIGINATOR_CODE, 4, SPACE_FILLER);
    header.appendWithEndFiller(ECERT_SENT_TITLE, 40, SPACE_FILLER);
    header.appendDate(this.processDate, DATE_FORMAT);
    header.appendDate(this.processDate, TIME_FORMAT);
    header.appendWithStartFiller(this.sequence.toString(), 6, NUMBER_FILLER);
    header.repeatAppend(SPACE_FILLER, 735); // Trailing space.
    return header.toString();
  }

  public createFromLine(line: string): ECertFullTimeFileHeader {
    const header = new ECertFullTimeFileHeader();
    header.recordTypeCode = line.substring(0, 3) as RecordTypeCodes;
    header.processDate = getDateOnlyFromFormat(
      line.substring(47, 55),
      DATE_FORMAT,
    );
    return header;
  }
}
