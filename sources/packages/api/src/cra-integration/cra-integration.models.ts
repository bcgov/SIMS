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

export enum RequestStatusCodes {
  successfulRequest = "01",
  successfulAnm = "02",
  unsuccessfulAcctNotAvail = "55",
  invalidProgramAreaCD = "56",
  unsuccessfulRequestNoData = "59",
}

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
}

/**
 * Result of a file uploaded to SFTP on ZONE B network.
 */
export interface CRAUploadResult {
  generatedFile: string;
  uploadedRecords: number;
}
