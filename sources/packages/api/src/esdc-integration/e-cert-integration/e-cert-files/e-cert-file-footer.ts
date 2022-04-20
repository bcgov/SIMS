import { Injectable } from "@nestjs/common";
import { FixedFormatFileLine } from "../../../services/ssh/sftp-integration-base.models";
import { RecordTypeCodes } from "../models/e-cert-integration-model";

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
}
