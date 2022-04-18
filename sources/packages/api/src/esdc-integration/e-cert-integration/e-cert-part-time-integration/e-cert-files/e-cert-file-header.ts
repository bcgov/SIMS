import { StringBuilder, getDateOnlyFromFormat } from "../../../../utilities";
import {
  SPACE_FILLER,
  TIME_FORMAT,
  DATE_FORMAT,
} from "../../../models/esdc-integration.model";
import {
  ECERT_SENT_TITLE,
  RecordTypeCodes,
} from "../../models/e-cert-integration-model";
import { ECertFileHeader } from "../../e-cert-files/e-cert-file-header";

const ORIGINATOR_CODE = "BC";

/**
 * Header of a Part-Time E-Cert file.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class ECertPartTimeFileHeader extends ECertFileHeader {
  processDate: Date;
  sequence: number;

  public getFixedFormat(): string {
    const header = new StringBuilder();
    header.append(this.recordTypeCode);
    header.appendWithEndFiller(ORIGINATOR_CODE, 4, SPACE_FILLER);
    header.appendWithEndFiller(ECERT_SENT_TITLE, 40, SPACE_FILLER);
    header.appendDate(this.processDate, DATE_FORMAT);
    header.appendDate(this.processDate, TIME_FORMAT);
    header.repeatAppend(SPACE_FILLER, 698); // Trailing space.
    return header.toString();
  }

  public createFromLine(line: string): ECertPartTimeFileHeader {
    const header = new ECertPartTimeFileHeader();
    header.recordTypeCode = line.substring(0, 3) as RecordTypeCodes;
    header.processDate = getDateOnlyFromFormat(
      line.substring(56, 64),
      DATE_FORMAT,
    );
    return header;
  }
}
