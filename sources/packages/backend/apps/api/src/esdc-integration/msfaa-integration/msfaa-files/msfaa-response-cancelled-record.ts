import { getDateOnlyFromFormat } from "../../../utilities";
import { DATE_FORMAT } from "../../models/esdc-integration.model";
import { MSFAAResponseRecordIdentification } from "./msfaa-response-record-identification";

/**
 * MSFAA record cancelled (Trans Sub Code - C) that
 * contains the details of New Issuing Province and cancelled Date.
 * This record is part of the details record in the MSFAA
 * response file has been extended from the base
 * MSFAAResponseRecordIdentification class to have the common
 * values between the received and cancelled records.
 * Please note that the numbers below (e.g. line.substr(25, 2))
 * represents the position of the information in a fixed text file format.
 * The documentation about it is available on the document
 * 'SLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class MSFAAResponseCancelledRecord extends MSFAAResponseRecordIdentification {
  constructor(line: string, lineNumber: number) {
    super(line, lineNumber);
  }

  /**
   * New Province code that issued the MSFAA
   */
  public get newIssusingProvince(): string {
    return this.line.substr(48, 2);
  }

  /**
   * Date when the MSFAA was cancelled
   */
  public get cancelledDate(): Date {
    return getDateOnlyFromFormat(this.line.substr(50, 8), DATE_FORMAT);
  }
}
