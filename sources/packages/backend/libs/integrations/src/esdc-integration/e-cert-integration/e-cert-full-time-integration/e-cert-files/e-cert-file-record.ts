import {
  RecordTypeCodes,
  Award,
  DATE_FORMAT,
  NUMBER_FILLER,
  SPACE_FILLER,
} from "../../models/e-cert-integration-model";
import { ECertFileRecord } from "../../e-cert-files/e-cert-file-record";
import { StringBuilder } from "@sims/utilities";

/**
 * Number of possible awards available to be provided (code and amount).
 */
const AWARD_SLOTS = 10;

/**
 * Record of an Entitlement Full-Time E-Cert file.
 * The documentation about it is available on the document
 * 'CSLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class ECertFullTimeFileRecord extends ECertFileRecord {
  recordType: RecordTypeCodes;
  /**
   * Social insurance number of student.
   */
  sin: string;
  /**
   * Student Application number.
   */
  applicationNumber: string;
  /**
   * Unique number assigned to this entitlement record.
   */
  documentNumber: number;
  /**
   * Date when the funds on this document (e-Cert) can be released.
   */
  disbursementDate: Date;
  /**
   * Date the document (e-Cert) was created.
   */
  documentProducedDate: Date;
  /**
   * The maximum date that this document is valid to.
   */
  negotiatedExpiryDate: Date;
  /**
   * Total dollar amount of all funding types on this document (e-Cert).
   * ! Must be rounded, only integer, no decimals.
   */
  disbursementAmount: number;
  /**
   * Dollar amount that should be sent to the student. This represents the total
   * disbursement amount minus the school amount (a.k.a. tuition remittance) that
   * should go to the student on this document.
   * ! Must be rounded, only integer, no decimals.
   */
  studentAmount: number;
  /**
   * Dollar amount that should be sent to the school. This represents the total amount of
   * BCSL/grants and CSL/grants that should go to the student on this document.
   * ! Must be rounded, only integer, no decimals.
   */
  schoolAmount: number;
  /**
   * Federal loan dollar amount to be disbursed.
   * ! Must be rounded, only integer, no decimals.
   */
  cslAwardAmount: number;
  /**
   * Provincial loan dollar amount to be disbursed.
   * ! Must be rounded, only integer, no decimals.
   */
  bcslAwardAmount: number;
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
   * Total years in the program.
   */
  totalYearsOfStudy: number;
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
   * Borrower marital status S= Single, M = Married, O = Other.
   */
  maritalStatus: string;
  /**
   * Student number (at the Educational Institution).
   */
  studentNumber: string;
  /**
   * Total of all grant awards on this Entitlement Record.
   */
  totalGrantAmount: number;
  /**
   * Federal grants list (maximum 10) where 6 to 10 are not expecting data.
   * ! All values must be rounded, only integers, no decimals.
   */
  grantAwards: Award[];
  /**
   * Persistent or prolonged disability flag (Y or N).
   */
  ppdFlag: string;

  public getFixedFormat(): string {
    try {
      const record = new StringBuilder();
      record.append(this.recordType);
      record.append(this.sin, 9);
      record.appendWithStartFiller(this.applicationNumber, 19, NUMBER_FILLER);
      record.appendWithStartFiller(this.documentNumber, 8, NUMBER_FILLER);
      record.appendDate(this.disbursementDate, DATE_FORMAT);
      record.appendDate(this.documentProducedDate, DATE_FORMAT);
      record.appendDate(this.negotiatedExpiryDate, DATE_FORMAT);
      record.appendWithStartFiller(this.disbursementAmount, 6, NUMBER_FILLER);
      record.appendWithStartFiller(this.studentAmount, 8, NUMBER_FILLER);
      record.appendWithStartFiller(this.schoolAmount, 8, NUMBER_FILLER);
      record.appendWithStartFiller(this.cslAwardAmount, 6, NUMBER_FILLER);
      record.appendWithStartFiller(this.bcslAwardAmount, 6, NUMBER_FILLER);
      record.appendDate(this.educationalStartDate, DATE_FORMAT);
      record.appendDate(this.educationalEndDate, DATE_FORMAT);
      record.appendWithEndFiller(this.federalInstitutionCode, 4, SPACE_FILLER);
      record.appendWithStartFiller(this.weeksOfStudy, 2, NUMBER_FILLER);
      record.appendWithStartFiller(this.fieldOfStudy, 2, NUMBER_FILLER);
      record.append(this.yearOfStudy.toString(), 1);
      record.append(this.totalYearsOfStudy.toString(), 1);
      record.repeatAppend(NUMBER_FILLER, DATE_FORMAT.length); // Cancel Date, optional, not provided.
      record.append("F"); // 'F' for full-time. Part time is done by another integration to another system.
      record.repeatAppend(SPACE_FILLER, 2); // Provincial field of study code, optional, not provided.
      record.appendDate(this.enrollmentConfirmationDate, DATE_FORMAT);
      // The below information indicates if e-cert or paper certificate is sent (E=E-cert; P=Paper).
      // Paper is no longer used, the data options existed in the past to support a transition period
      // and has not been removed from the files. We only send electronic files now.
      record.append("E"); // Indicates if e-cert or paper certificate E=E-cert; P=Paper.
      record.appendDate(this.dateOfBirth, DATE_FORMAT);
      record.appendWithEndFiller(this.lastName, 25, SPACE_FILLER);
      record.appendWithEndFiller(this.firstName ?? "", 15, SPACE_FILLER);
      record.repeatAppend(SPACE_FILLER, 3); // Initials, optional, not provided.
      record.appendWithEndFiller(this.addressLine1, 40, SPACE_FILLER);
      record.appendWithEndFiller(this.addressLine2 ?? "", 40, SPACE_FILLER);
      record.appendWithEndFiller(this.city, 25, SPACE_FILLER);
      record.appendWithEndFiller(this.provinceState ?? "", 4, SPACE_FILLER);
      record.appendWithEndFiller(this.postalCode ?? "", 16, SPACE_FILLER);
      record.appendWithEndFiller(this.country, 20, SPACE_FILLER);
      record.repeatAppend(SPACE_FILLER, 20); // Phone Number, optional, not provided.
      record.appendWithEndFiller(this.emailAddress, 70, SPACE_FILLER);
      record.repeatAppend(SPACE_FILLER, 40); // Alternate Address Line 1, optional, not provided.
      record.repeatAppend(SPACE_FILLER, 40); // Alternate Address Line 2, optional, not provided.
      record.repeatAppend(SPACE_FILLER, 25); // Alternate City, optional, not provided.
      record.repeatAppend(SPACE_FILLER, 4); // Alternate Province, optional, not provided.
      record.repeatAppend(SPACE_FILLER, 16); // Alternate Postal Code, optional, not provided.
      record.repeatAppend(SPACE_FILLER, 20); // Alternate Country Name, optional, not provided.
      record.repeatAppend(SPACE_FILLER, 20); // Alternate Phone Number, optional, not provided.
      record.append(this.gender, 1);
      record.append(this.maritalStatus, 1);
      record.appendWithEndFiller(this.studentNumber ?? "", 12, SPACE_FILLER);
      record.append("E"); // Student’s language preference E= English, F= French.
      record.appendWithStartFiller(this.totalGrantAmount, 6, NUMBER_FILLER);
      // Add the list of awards codes and values that always fill the same amount
      // of slots defined on GRANT_AWARD_SLOTS. When there values available
      for (let i = 0; i < AWARD_SLOTS; i++) {
        const award = this.grantAwards.shift();
        if (award) {
          record.appendWithEndFiller(award.valueCode, 4, SPACE_FILLER);
          record.appendWithStartFiller(award.valueAmount, 6, NUMBER_FILLER);
        } else {
          record.repeatAppend(SPACE_FILLER, 10); // Empty data for code(length=4)+amount(length=6) = 10 empty spaces.
        }
      }

      record.repeatAppend(SPACE_FILLER, DATE_FORMAT.length); // Borrower Address Last Update Date, optional, not provided.
      record.repeatAppend(SPACE_FILLER, DATE_FORMAT.length); // Borrower Alternate Address Last Update, optional, not provided.
      record.append(this.ppdFlag, 1);
      record.repeatAppend(SPACE_FILLER, 68); // Trailing space
      return record.toString();
    } catch (error: unknown) {
      throw new Error(
        `Error while creating record with document number: ${this.documentNumber}`,
        { cause: error },
      );
    }
  }
}
