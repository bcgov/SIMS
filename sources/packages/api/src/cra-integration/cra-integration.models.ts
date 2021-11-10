import { CRAResponseStatusRecord } from "./cra-files/cra-response-status-record";
import { CRAResponseTotalIncomeRecord } from "./cra-files/cra-response-total-income-record";

export const DATE_FORMAT = "YYYYMMDD";
export const SPACE_FILLER = " ";
export const NUMBER_FILLER = "0";

/**
 * Codes used to start all the lines of the files sent to CRA.
 */
export enum TransactionCodes {
  MatchingRunHeader = "7000",
  MatchingRunRecord = "7001",
  MatchingRunFooter = "7002",
  IncomeRequestHeader = "7100",
  IncomeRequestRecord = "7101",
  IncomeRequestFooter = "7102",
  ResponseHeader = "7200",
  ResponseRecord = "7201",
}

/**
 * Secondary codes used alongside the records.
 * They could be part of the request or response,
 * as described below.
 */
export enum TransactionSubCodes {
  /**
   * Sub code used to request a status or a
   * income verification. This record will be part
   * of the request and will contain the personal
   * data to be validated (first name, last name,
   * DON and SIN).
   */
  IVRequest = "0020",
  /**
   * This record wll be part of the response and
   * contains validation statuses about the person data
   * (e.g. first name, last name, DOB, SIN) and
   * about the CRA tax files.
   * This record is part of the standard records
   * that comprise the response file.
   */
  ResponseStatusRecord = "0022",
  /**
   * This record will be part of the response and
   * contains information about the total income
   * on CRA for a particular year.
   */
  TotalIncome = "0150",
}

/**
 * Request status codes (REQUEST-STATUS-CODE)
 * presents on CRA Response Record
 * (Trans Sub Code - 0022).
 */
export enum RequestStatusCodes {
  successfulRequest = "01",
  successfulAnm = "02",
  unsuccessfulAcctNotAvail = "55",
  invalidProgramAreaCD = "56",
  unsuccessfulRequestNoData = "59",
}

/**
 * Match status codes (MATCH-STATUS-CODE) presents on
 * CRA Response Record (Trans Sub Code - 0022).
 * 'The match' means that, when we send the first name,
 * last name, DOB and SIN, CRA will check if the personal
 * information matches with its own data.
 */
export enum MatchStatusCodes {
  matchStatusCodeNotSet = "00",
  successfulMatch = "01",
  unsuccessfulMatch = "50",
}

/**
 * Inactive codes (INACTIVE-CRA-INDIVIDUAL-CODE) presents on
 * CRA Response Record (Trans Sub Code - 0022).
 * Examples of inactive could be the taxpayer is deceased or emigrant.
 */
export enum InactiveCodes {
  inactiveCodeNotSet = "00",
  inactiveCodeSet = "01",
}

/**
 * Required personal information to a
 * CRA verification be processed.
 */
export interface CRAPersonRecord {
  sin: string;
  surname: string;
  givenName: string;
  birthDate: Date;
  taxYear?: number;
  freeProjectArea?: string;
}

/**
 * Result of a file uploaded to SFTP on ZONE B network.
 */
export interface CRAUploadResult {
  generatedFile: string;
  uploadedRecords: number;
}

/**
 * Represents the parsed content of a file
 * downloaded from the CRA SFTP response folder.
 */
export interface CRASFTPResponseFile {
  /**
   * Response statuses records present on the file.
   */
  statusRecords: CRAResponseStatusRecord[];
  /**
   * Total income records present on the file.
   */
  totalIncomeRecords: CRAResponseTotalIncomeRecord[];
}

/**
 * Represents the output of the processing of
 * one CRA response file from the. SFTP
 */
export class ProcessSftpResponseResult {
  /**
   * Processing summary for a file.
   */
  processSummary: string[] = [];
  /**
   * Errors found during the processing.
   */
  errorsSummary: string[] = [];
}
