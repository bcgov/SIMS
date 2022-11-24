import { RecordTypeCodes } from "../models/e-cert-integration-model";
import { FixedFormatFileLine } from "@sims/integrations/services/ssh";
import { Injectable } from "@nestjs/common";

/**
 * Footer of an E-Cert file.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
@Injectable()
export abstract class ECertFileFooter implements FixedFormatFileLine {
  recordTypeCode: RecordTypeCodes;
  totalSINHash: number;
  recordCount: number;
  abstract getFixedFormat(): string;

  abstract createFromLine(line: string): ECertFileFooter;

  abstract getFeedbackFooterRecordType(): RecordTypeCodes;
}
