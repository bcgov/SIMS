import { RecordTypeCodes } from "../models/ece-integration.model";
import { StringBuilder } from "@sims/utilities";
import { NUMBER_FILLER } from "@sims/integrations/esdc-integration/e-cert-integration/models/e-cert-integration-model";
import { ECERequestFileLine } from "./ece-file-line";

/**
 * Footer of a ECE request file.
 * The documentation about it is available on the document
 * 'SIMSSFAS - Institution File layouts In Analysis Folder'.
 */
export class ECEFileFooter implements ECERequestFileLine {
  recordTypeCode: RecordTypeCodes;
  recordCount: number;

  getFixedFormat(): string {
    const footer = new StringBuilder();
    footer.append(this.recordTypeCode);
    footer.appendWithStartFiller(this.recordCount.toString(), 6, NUMBER_FILLER);
    return footer.toString();
  }
}
