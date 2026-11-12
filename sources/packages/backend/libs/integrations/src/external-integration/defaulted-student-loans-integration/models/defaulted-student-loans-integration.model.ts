export enum DefaultedStudentLoanRecordType {
  Header = "AA",
  Detail = "NA",
  Footer = "ZZ",
}

/**
 * Date format used in the defaulted student loans file.
 * Official document states the format as CCYYMMDD which corresponds to YYYYMMDD.
 */
export const DEFAULTED_STUDENT_LOANS_DATE_FORMAT = "YYYYMMDD";

/**
 * Fixed value sent as transmission ID for the defaulted student loans integration.
 */
export const TRANSMISSION_SOURCE_ID = "STLDLLAB";

export const SPACE_FILLER = " ";
export const NUMBER_FILLER = "0";
