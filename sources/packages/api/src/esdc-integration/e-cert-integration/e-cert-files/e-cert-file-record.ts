import { Injectable } from "@nestjs/common";
import { FixedFormatFileLine } from "../../../services/ssh/sftp-integration-base.models";

/**
 * Record of an Entitlement E-Cert file.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
@Injectable()
export abstract class ECertFileRecord implements FixedFormatFileLine {
  abstract getFixedFormat(): string;
}
