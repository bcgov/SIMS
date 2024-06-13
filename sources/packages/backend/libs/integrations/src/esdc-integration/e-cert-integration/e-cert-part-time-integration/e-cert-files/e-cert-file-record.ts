import {
  DATE_FORMAT,
  NUMBER_FILLER,
  RecordTypeCodes,
  SPACE_FILLER,
} from "../../models/e-cert-integration-model";
import { ECertFileRecord } from "../../e-cert-files/e-cert-file-record";
import { StringBuilder } from "@sims/utilities";

/**
 * Record of an Entitlement Part-Time E-Cert file.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class ECertPartTimeFileRecord extends ECertFileRecord {
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
   * Dollar amount that should be sent to the student. This represents the total
   * school amount - tuition remittance amount that should go to the student on this document.
   * ! Must be rounded, only integer, no decimals.
   */
  schoolAmount: number;
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
   * Student country name.
   */
  country: string;
  /**
   * Student email address.
   */
  emailAddress: string;
  /**
   * State/province, mandatory when Canada.
   */
  provinceState?: string;
  /**
   * Postal code, mandatory when Canada.
   */
  postalCode?: string;
  /**
   * Gender (M=man, F=woman, X=nonBinary empty=preferNotToAnswer).
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
  totalCanadaAndProvincialGrantsAmount: number;
  /**
   * Certificate number, the generated sequence number for the file.
   */
  certNumber: number;
  /**
   * BC Part-time grant amount.
   */
  totalBCGrantAmount: number;
  /**
   * Amount of Grant for Part-time Studies (CSGP-PT) at the study start.
   */
  csgpPTAmount: number;
  /**
   * Amount of Grant for Students with Permanent Disabilities (CSGP-PD) at the study start.
   */
  csgpPDAmount: number;
  /**
   * Amount Grant for Part-time Students with Dependants (CSGP-PTDEP) at the study start.
   */
  csgpPTDEPAmount: number;
  /**
   * CourseLoad for the PartTime course.
   */
  courseLoad: number;
  /**
   * Persistent or prolonged disability flag (Y or N).
   */
  ppdFlag: string;

  public getFixedFormat(): string {
    const record = new StringBuilder();
    try {
      record.append(this.recordType);
      record.appendWithEndFiller(this.lastName, 25, SPACE_FILLER);
      record.appendWithEndFiller(this.firstName ?? "", 15, SPACE_FILLER);
      record.repeatAppend(SPACE_FILLER, 3); // Initials, optional, not provided.
      record.append(this.sin, 9);
      record.append(this.gender, 1);
      record.appendDate(this.dateOfBirth, DATE_FORMAT);
      record.appendWithEndFiller(this.maritalStatus, 4, SPACE_FILLER);
      record.appendWithEndFiller(this.addressLine1, 40, SPACE_FILLER);
      record.appendWithEndFiller(this.addressLine2 ?? "", 40, SPACE_FILLER);
      record.repeatAppend(SPACE_FILLER, 40); // AddressLine 3, optional, not provided.
      record.appendWithEndFiller(this.city, 25, SPACE_FILLER);
      record.appendWithEndFiller(this.provinceState ?? "", 4, SPACE_FILLER);
      record.appendWithEndFiller(this.country, 4, SPACE_FILLER);
      record.appendWithEndFiller(this.postalCode ?? "", 16, SPACE_FILLER);
      record.repeatAppend(SPACE_FILLER, 16); // Telephone, optional, not provided.
      record.repeatAppend(SPACE_FILLER, 40); // Alternate Address 1, optional, not provided.
      record.repeatAppend(SPACE_FILLER, 40); // Alternate Address 2, optional, not provided.
      record.repeatAppend(SPACE_FILLER, 40); // Alternate Address 3, optional, not provided.
      record.repeatAppend(SPACE_FILLER, 25); // Alternate City, optional, not provided.
      record.repeatAppend(SPACE_FILLER, 4); // Alternate Province, optional, not provided.
      record.repeatAppend(SPACE_FILLER, 4); // Alternate Country, optional, not provided.
      record.repeatAppend(SPACE_FILLER, 16); // Alternate Postal Code, optional, not provided.
      record.repeatAppend(SPACE_FILLER, 16); // Alternate Telephone, optional, not provided.
      record.appendWithEndFiller(this.studentNumber ?? "", 12, SPACE_FILLER);
      record.appendDate(this.disbursementDate, DATE_FORMAT);
      record.appendWithStartFiller(this.disbursementAmount, 9, NUMBER_FILLER);
      record.appendWithStartFiller(this.certNumber, 7, NUMBER_FILLER);
      record.appendDate(this.educationalStartDate, DATE_FORMAT);
      record.appendDate(this.educationalEndDate, DATE_FORMAT);
      record.appendWithEndFiller(this.federalInstitutionCode, 4, SPACE_FILLER);
      record.appendWithEndFiller(this.fieldOfStudy.toString(), 4, SPACE_FILLER);
      record.append(this.yearOfStudy.toString(), 1);
      record.appendWithStartFiller(this.weeksOfStudy, 3, NUMBER_FILLER);
      record.appendDate(this.documentProducedDate, DATE_FORMAT);
      record.repeatAppend(SPACE_FILLER, 8); // TODO Cancel Date, E-cert cancellation date.
      record.repeatAppend(NUMBER_FILLER, 9); // CAG PD Amt, no longer used.
      record.repeatAppend(NUMBER_FILLER, 9); // CAG LI Amt, no longer used.
      record.appendWithStartFiller(
        this.totalCanadaAndProvincialGrantsAmount,
        5,
        NUMBER_FILLER,
      );
      record.appendWithStartFiller(this.csgpPTAmount, 5, NUMBER_FILLER);
      record.repeatAppend(NUMBER_FILLER, 5); // CSGP NBD MI Amt, No longer used.
      record.appendWithStartFiller(this.csgpPDAmount, 5, NUMBER_FILLER);
      record.appendWithStartFiller(this.csgpPTDEPAmount, 5, NUMBER_FILLER);
      record.repeatAppend(NUMBER_FILLER, 5); // Amount of Grant for Services and Equipment for Students with Permanent Disabilities (CSGP-PDSE) at the study start, No longer used.
      record.appendWithStartFiller(this.totalBCGrantAmount, 5, NUMBER_FILLER);
      record.repeatAppend(NUMBER_FILLER, 5); // BC Part-time grant amount 2 - Reserved for future use
      record.repeatAppend(SPACE_FILLER, 10); // Space filler.
      record.repeatAppend(SPACE_FILLER, 8); // CSGP MP Date, No longer used.
      record.repeatAppend(SPACE_FILLER, 5); // CSGP MP PT Amt, No longer used.
      record.repeatAppend(SPACE_FILLER, 5); // CSGP MP MI Amt, No longer used.
      record.repeatAppend(SPACE_FILLER, 5); // CSGP MP PD Amt, No longer used.
      record.repeatAppend(SPACE_FILLER, 5); // CSGP MP PTDEP Amt, No longer used.
      record.repeatAppend(SPACE_FILLER, 5); // CSGP MP PDSE Amt, No longer used.
      record.repeatAppend(SPACE_FILLER, 20); // Space filler.
      record.appendWithEndFiller(this.emailAddress, 75, SPACE_FILLER);
      record.append("P"); // 'P' for part-time. Full time is done by another integration to another system.
      record.appendDate(this.enrollmentConfirmationDate, DATE_FORMAT);
      record.appendWithStartFiller(this.schoolAmount, 7, NUMBER_FILLER);
      record.appendWithStartFiller(this.courseLoad, 2, NUMBER_FILLER);
      record.append(this.ppdFlag, 1);
      record.repeatAppend(SPACE_FILLER, 24); // Space filler.
      return record.toString();
    } catch (error: unknown) {
      throw new Error(
        `Error while creating record with document number: ${this.certNumber}`,
        { cause: error },
      );
    }
  }
}
