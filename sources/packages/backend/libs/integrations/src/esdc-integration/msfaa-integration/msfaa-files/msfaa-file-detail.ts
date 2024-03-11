import {
  DATE_FORMAT,
  MSFAARequestFileLine,
  MSFAA_SENT_STATUS_CODE,
  NUMBER_FILLER,
  RecordTypeCodes,
  SPACE_FILLER,
} from "../models/msfaa-integration.model";
import { StringBuilder } from "@sims/utilities";

/**
 * Record of a MSFAA request file.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class MSFAAFileDetail implements MSFAARequestFileLine {
  transactionCode: RecordTypeCodes;
  processDate: Date;
  msfaaNumber: string;
  sin: string;
  institutionCode: string;
  birthDate: Date;
  surname: string;
  givenName: string;
  genderCode: string;
  maritalStatusCode: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  provinceState?: string;
  postalCode?: string;
  country: string;
  phone?: string;
  email?: string;
  offeringIntensityCode: string;

  public getFixedFormat(): string {
    const record = new StringBuilder();
    record.append(this.transactionCode);
    record.appendWithStartFiller(this.msfaaNumber, 10, NUMBER_FILLER);
    record.append(this.sin, 9);
    record.append(MSFAA_SENT_STATUS_CODE);
    record.append(this.institutionCode);
    record.appendDate(this.birthDate, DATE_FORMAT);
    record.appendDate(this.processDate, DATE_FORMAT);
    record.appendWithEndFiller(this.surname, 25, SPACE_FILLER);
    record.appendWithEndFiller(this.givenName ?? "", 15, SPACE_FILLER); // Potentially null for mononymous names.
    record.repeatAppend(SPACE_FILLER, 3); // Initials.
    record.append(this.genderCode);
    record.append(this.maritalStatusCode);
    record.appendWithEndFiller(this.addressLine1, 40, SPACE_FILLER);
    record.appendWithEndFiller(this.addressLine2 ?? "", 40, SPACE_FILLER);
    record.appendWithEndFiller(this.city, 25, SPACE_FILLER);
    record.appendWithEndFiller(this.provinceState ?? "", 4, SPACE_FILLER);
    record.appendWithEndFiller(this.postalCode ?? "", 16, SPACE_FILLER);
    record.appendWithEndFiller(this.country, 20, SPACE_FILLER);
    record.appendWithStartFiller(this.phone ?? "", 20, NUMBER_FILLER);
    record.appendWithEndFiller(this.email ?? "", 70, SPACE_FILLER);
    record.repeatAppend(SPACE_FILLER, 40); // Alternate Address line 1.
    record.repeatAppend(SPACE_FILLER, 40); // Alternate Address line 2.
    record.repeatAppend(SPACE_FILLER, 25); // Alternate City.
    record.repeatAppend(SPACE_FILLER, 4); // Alternate Province.
    record.repeatAppend(SPACE_FILLER, 16); // Alternate Postal Code.
    record.repeatAppend(SPACE_FILLER, 20); // Alternate Country.
    record.repeatAppend(SPACE_FILLER, 20); // Alternate Phone.
    record.append(this.offeringIntensityCode);
    record.repeatAppend(SPACE_FILLER, 110); // Trailing space.
    return record.toString();
  }
}
