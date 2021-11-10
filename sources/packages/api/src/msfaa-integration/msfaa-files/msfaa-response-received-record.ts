import { getDateOnlyFromFormat } from "../../utilities";
import { DATE_FORMAT } from "../models/msfaa-integration.model";
import { MSFAAResponseRecordIdentification } from "./msfaa-response-record-identification";

/**
 * MSFAA record received (Trans Sub Code - R) that
 * contains the details of Borrower Signed Date,
 * Service Provider Received Date.
 * This record is part of the details record in the MSFAA
 * response file has been extended from the base
 * MSFAAResponseRecordIdentification class to have the common
 * values between the received and cancelled records.
 * Please note that the numbers below (e.g. line.substr(25, 2))
 * represents the position of the information in a fixed text file format.
 * The documentation about it is available on the document
 * 'SLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class MSFAAResponseReceivedRecord extends MSFAAResponseRecordIdentification {
  constructor(line: string, lineNumber: number) {
    super(line, lineNumber);
  }

  /**
   * Date that the borrower indicated that the MSFAA was Signed
   */
  public get borrowerSignedDate(): Date {
    return getDateOnlyFromFormat(this.line.substr(23, 8), DATE_FORMAT);
  }

  /**
   * Date MSFAA was received by/resolved from Canada Post/Kiosk
   */
  public get serviceProviderReceivedDate(): Date {
    return getDateOnlyFromFormat(this.line.substr(31, 8), DATE_FORMAT);
  }
}
