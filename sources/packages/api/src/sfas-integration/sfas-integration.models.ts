export const DATE_FORMAT = "YYYYMMDD";

export enum RecordTypeCodes {
  Header = 100,
  IndividualDataRecord = 200,
  ApplicationDataRecord = 300,
  RestrictionDataRecord = 400,
}

export class ProcessSftpResponseResult {
  processSummary: string[] = [];
  errorsSummary: string[] = [];
}
