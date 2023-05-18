import { DisbursementValue } from "@sims/sims-db";

export const ECE_SENT_TITLE = "CONFIRMATION REQUEST";

/**
 * Result of a file uploaded to SFTP on ZONE B network.
 */
export interface ECEUploadResult {
  generatedFile: string;
  uploadedRecords: number;
}

export interface ECERecord {
  institutionCode: string;
  disbursementValues: DisbursementValue[];
  sin: string;
  studentLastName: string;
  studentGivenName: string;
  birthDate: string;
  applicationNumber: string;
  institutionStudentNumber: string;
  studyStartDate: string;
  studyEndDate: string;
  disbursementDate: string;
}

export const DATE_FORMAT = "YYYYMMDD";
export const SPACE_FILLER = " ";
export const NUMBER_FILLER = "0";

/**
 * Codes used to start all the lines of the files sent to Institution.
 */
export enum RecordTypeCodes {
  ECEHeader = "1",
  ECEDetail = "2",
  ECETrailer = "3",
}

export interface ECEDisbursements {
  [disbursementId: string]: {
    institutionCode: string;
    applicationNumber: string;
    awardDetails: {
      payToSchoolAmount: number;
      isEnrolmentConfirmed: boolean;
      enrolmentConfirmationDate: Date;
    }[];
  };
}
