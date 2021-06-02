import { CRARecordIdentification } from "./cra-files/cra-file-response-record-id";

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
 */
export enum TransactionSubCodes {
  IVRequest = "0020",
  ResponseRecord = "0022",
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
 * Match status codes (MATCH-STATUS-CODE)
 * presents on CRA Response Record
 * (Trans Sub Code - 0022)
 */
export enum MatchStatusCodes {
  matchStatusCodeNotSet = "00",
  successfulMatch = "01",
  unsuccessfulMatch = "50",
}

/**
 * Required personal information to a
 * CRA verification be processsed.
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
 * downloaded from the CRA sFTP response folder.
 */
export interface CRAsFtpResponseFile {
  /**
   * Full file path of the file on the sFTP.
   */
  filePath: string;
  /**
   * Parsed object from the CRA response files.
   * Each object represents a line from the file.
   */
  records: CRARecordIdentification[];
}

/**
 * Represents the output of the processing of
 * one CRA response file from the. sFTP
 */
export class ProcessSftpResponseResult {
  /**
   * Processing summary for a file.
   */
  processSummary: string[] = [];
  /**
   * Errors found uring the processing.
   */
  errorsSummary: string[] = [];
}
