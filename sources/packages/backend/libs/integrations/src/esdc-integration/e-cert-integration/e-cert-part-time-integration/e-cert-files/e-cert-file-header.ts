import { getDateOnlyFromFormat, StringBuilder } from "@sims/utilities";
import {
  DATE_FORMAT,
  ECERT_PT_SENT_TITLE,
  NUMBER_FILLER,
  RecordTypeCodes,
  SPACE_FILLER,
} from "../../models/e-cert-integration-model";
import { ECertFileHeader } from "../../e-cert-files/e-cert-file-header";
import { TIME_FORMAT } from "@sims/integrations/esdc-integration/models/esdc-integration.model";

const ORIGINATOR_CODE = "BC";

/**
 * Header of a Part-Time E-Cert file.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class ECertPartTimeFileHeader extends ECertFileHeader {
  getFixedFormat(): string {
    const header = new StringBuilder();
    header.append(this.recordTypeCode);
    header.appendWithEndFiller(ORIGINATOR_CODE, 4, SPACE_FILLER);
    header.appendWithEndFiller(ECERT_PT_SENT_TITLE, 40, SPACE_FILLER);
    header.appendDate(this.processDate, DATE_FORMAT);
    header.appendDate(this.processDate, TIME_FORMAT);
    header.appendWithStartFiller(this.sequence, 6, NUMBER_FILLER);
    header.repeatAppend(SPACE_FILLER, 698); // Trailing space.
    return header.toString();
  }

  createFromLine(line: string): ECertPartTimeFileHeader {
    const header = new ECertPartTimeFileHeader();
    header.recordTypeCode = line.substring(0, 2) as RecordTypeCodes;
    header.processDate = getDateOnlyFromFormat(
      line.substring(56, 64),
      DATE_FORMAT,
    );
    return header;
  }

  getFeedbackHeaderRecordType(): RecordTypeCodes {
    return RecordTypeCodes.ECertPartTimeFeedbackHeader;
  }
}
