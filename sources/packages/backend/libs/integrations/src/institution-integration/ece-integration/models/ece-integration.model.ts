import { DisabilityStatus, DisbursementValue } from "@sims/sims-db";

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
  studentDisabilityStatus: DisabilityStatus;
  applicationNumber: string;
  applicationStudentDisabilityStatus: boolean;
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

export interface DisbursementDetails {
  institutionCode: string;
  applicationNumber: string;
  awardDetails: DisbursementAwardDetails[];
}

export interface DisbursementAwardDetails {
  payToSchoolAmount: number;
  enrolmentConfirmationFlag: YNOptions;
  enrolmentConfirmationDate: Date;
}

export interface ECEDisbursements {
  [disbursementScheduleId: string]: DisbursementDetails;
}

export class DisbursementProcessingDetails {
  fileParsingErrors = 0;
  totalRecords = 0;
  totalDisbursements = 0;
  disbursementsSuccessfullyProcessed = 0;
  disbursementsSkipped = 0;
  duplicateDisbursements = 0;
  disbursementsFailedToProcess = 0;
}

/**
 * Single character Yes | No option.
 */
export enum YNOptions {
  Y = "Y",
  N = "N",
}
