import { StringBuilder } from "../../../../utilities/string-builder";
import { RecordTypeCodes } from "../../models/e-cert-integration-model";
import {
  SPACE_FILLER,
  NUMBER_FILLER,
  DATE_FORMAT,
} from "../../../models/esdc-integration.model";
import { ECertFileRecord } from "../../e-cert-files/e-cert-file-record";

/**
 * Record of an Entitlement E-Cert file.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class ECertPartTimeFileRecord implements ECertFileRecord {
  recordType: RecordTypeCodes;
  /**
   * Social insurance number of student.
   */
  sin: string;
  /**
   * Date when the funds on this document (e-Cert) can be released.
   */
  disbursementDate: Date;
  /**
   * Date the document (e-Cert) was created.
   */
  documentProducedDate: Date;
  /**
   * Total dollar amount of all funding types on this document (e-Cert).
   * ! Must be rounded, only integer, no decimals.
   */
  disbursementAmount: number;
  /**
   * Date that studies commence. Generally derived from last application. The first day of classes.
   * Also known as the Period of Study Commencement Date (PSCD).
   */
  educationalStartDate: Date;
  /**
   * Date that studies end. Generally derived from the latest application. Last day of classes or last
   * exam date, whichever is latest. Also known as the Period of Study End Date (PSED).
   */
  educationalEndDate: Date;
  /**
   * Federal school code.
   */
  federalInstitutionCode: string;
  /**
   * Number of study weeks in study period.
   */
  weeksOfStudy: number;
  /**
   * Federal field of study code.
   */
  fieldOfStudy: number;
  /**
   * Student's Year of study.
   */
  yearOfStudy: number;
  /**
   * Date that the school confirmed enrolment.
   */
  enrollmentConfirmationDate: Date;
  /**
   * Student date of birth.
   */
  dateOfBirth: Date;
  /**
   * Student last name.
   */
  lastName: string;
  /**
   * Student first name.
   */
  firstName: string;
  /**
   * Student address.
   */
  addressLine1: string;
  /**
   * Student address
   */
  addressLine2: string;
  /**
   * Student city address.
   */
  city: string;
  /**
   * Student email address.
   */
  emailAddress: string;
  /**
   * Student gender M=Male F=Female.
   */
  gender: string;
  /**
   * Borrower marital status SI= Single, MA= Married, SP= Other.
   */
  maritalStatus: string;
  /**
   * Student number (at the Educational Institution).
   */
  studentNumber: string;
  /**
   * Sum of all CSGP grants + BC Provincial Part-time grants from this certificate.
   */
  totalGrantAmount: number;
  /**
   * Certificate number, the generated sequence number for the file.
   */
  certNumber: number;
  /**
   * BC Part-time grant amount 1.
   */
  totalBCSGAmount: number;
  /**
   * Amount of Grant for Part-time Studies (CSGP-PT) at the study start.
   */
  totalCSGPPTAmount: number;
  /**
   * Amount of Grant for Students with Permanent Disabilities (CSGP-PD) at the study start.
   */
  totalCSGPPDAmount: number;
  /**
   * Amount Grant for Part-time Students with Dependants (CSGP-PTDEP) at the study start.
   */
  totalCSGPPTDEPAmount: number;
  /**
   * CourseLoad for the PartTime course.
   */
  courseLoad: number;

  public getFixedFormat(): string {
    const record = new StringBuilder();
    record.append(this.recordType);
    record.appendWithEndFiller(this.lastName, 25, SPACE_FILLER);
    record.appendWithEndFiller(this.firstName || "", 15, SPACE_FILLER);
    record.repeatAppend(SPACE_FILLER, 3); // Initials, optional, not provided.
    record.append(this.sin, 9);
    record.append(this.gender, 1);
    record.appendDate(this.dateOfBirth, DATE_FORMAT);
    record.appendWithEndFiller(this.maritalStatus, 4, SPACE_FILLER);
    record.appendWithEndFiller(this.addressLine1, 40, SPACE_FILLER);
    record.appendWithEndFiller(this.addressLine2 || "", 40, SPACE_FILLER);
    record.repeatAppend(SPACE_FILLER, 40); // AddressLine 3, optional, not provided.
    record.appendWithEndFiller(this.city, 25, SPACE_FILLER);
    record.appendWithEndFiller("BC", 4, SPACE_FILLER); //TODO Province, is hardcoded to "BC  ".
    record.appendWithEndFiller("CAN", 4, SPACE_FILLER); // TODO Country, is hardcoded to "CAN ".
    record.repeatAppend(SPACE_FILLER, 16); //TODO Postal code, Filled with space as not provided.
    record.repeatAppend(SPACE_FILLER, 16); // Telephone, optional, not provided.
    record.repeatAppend(SPACE_FILLER, 40); // Alternate Address 1, optional, not provided.
    record.repeatAppend(SPACE_FILLER, 40); // Alternate Address 2, optional, not provided.
    record.repeatAppend(SPACE_FILLER, 40); // Alternate Address 3, optional, not provided.
    record.repeatAppend(SPACE_FILLER, 25); // Alternate City, optional, not provided.
    record.repeatAppend(SPACE_FILLER, 4); // Alternate Province, optional, not provided.
    record.repeatAppend(SPACE_FILLER, 4); // Alternate Country, optional, not provided.
    record.repeatAppend(SPACE_FILLER, 16); // Alternate Postal Code, optional, not provided.
    record.repeatAppend(SPACE_FILLER, 16); // Alternate Telephone, optional, not provided.
    record.appendWithEndFiller(this.studentNumber || "", 12, SPACE_FILLER);
    record.appendDate(this.disbursementDate, DATE_FORMAT);
    record.appendWithStartFiller(this.disbursementAmount, 9, NUMBER_FILLER);
    record.appendWithStartFiller(this.certNumber, 7, NUMBER_FILLER);
    record.appendDate(this.educationalStartDate, DATE_FORMAT);
    record.appendDate(this.educationalEndDate, DATE_FORMAT);
    record.appendWithEndFiller(this.federalInstitutionCode, 4, SPACE_FILLER);
    record.appendWithStartFiller(this.fieldOfStudy, 4, NUMBER_FILLER);
    record.append(this.yearOfStudy.toString(), 1);
    record.appendWithStartFiller(this.weeksOfStudy, 3, NUMBER_FILLER);
    record.appendDate(this.documentProducedDate, DATE_FORMAT);
    record.repeatAppend(SPACE_FILLER, 8); // TODO Cancel Date, E-cert cancellation date.
    record.repeatAppend(SPACE_FILLER, 9); //CAG PD Amt, No longer used.
    record.repeatAppend(SPACE_FILLER, 9); //CAG LI Amt, No longer used.
    record.appendWithStartFiller(this.totalGrantAmount, 5, NUMBER_FILLER);
    record.appendWithStartFiller(this.totalCSGPPTAmount, 5, NUMBER_FILLER);
    record.repeatAppend(NUMBER_FILLER, 5); // CSGP NBD MI Amt, No longer used.
    record.appendWithStartFiller(this.totalCSGPPDAmount, 5, NUMBER_FILLER);
    record.appendWithStartFiller(this.totalCSGPPTDEPAmount, 5, NUMBER_FILLER);
    record.repeatAppend(NUMBER_FILLER, 5); // Amount of Grant for Services and Equipment for Students with Permanent Disabilities (CSGP-PDSE) at the study start, No longer used.
    record.appendWithStartFiller(this.totalBCSGAmount, 5, NUMBER_FILLER);
    record.repeatAppend(NUMBER_FILLER, 5); // BC Part-time grant amount 2 - Reserved for future use
    record.repeatAppend(SPACE_FILLER, 10); // Space Filler.
    record.repeatAppend(SPACE_FILLER, 8); // CSGP MP Date, No longer used.
    record.repeatAppend(SPACE_FILLER, 5); // CSGP MP PT Amt, No longer used.
    record.repeatAppend(SPACE_FILLER, 5); // CSGP MP MI Amt, No longer used.
    record.repeatAppend(SPACE_FILLER, 5); // CSGP MP PD Amt, No longer used.
    record.repeatAppend(SPACE_FILLER, 5); // CSGP MP PTDEP Amt, No longer used.
    record.repeatAppend(SPACE_FILLER, 5); // CSGP MP PDSE Amt, No longer used.
    record.repeatAppend(SPACE_FILLER, 20); // Space Filler.
    record.appendWithEndFiller(this.emailAddress, 75, SPACE_FILLER);
    record.append("P"); // 'P' for part-time. Full time is done by another integration to another system.
    record.appendDate(this.enrollmentConfirmationDate, DATE_FORMAT);
    record.repeatAppend(SPACE_FILLER, 7); // EI Remittance Amt, optional, not provided.
    record.appendWithStartFiller(this.courseLoad, 2, NUMBER_FILLER);
    record.repeatAppend(SPACE_FILLER, 25); // Space Filler.
    return record.toString();
  }
}
