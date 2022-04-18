import { Injectable } from "@nestjs/common";
import { FixedFormatFileLine } from "../../../services/ssh/sftp-integration-base.models";
import { RecordTypeCodes } from "../models/e-cert-integration-model";

/**
 * Header of an E-Cert file.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
@Injectable()
export abstract class ECertFileHeader implements FixedFormatFileLine {
  recordTypeCode: RecordTypeCodes;
  processDate: Date;
  sequence: number;

  abstract getFixedFormat(): string;

  abstract createFromLine(line: string): ECertFileHeader;
}
