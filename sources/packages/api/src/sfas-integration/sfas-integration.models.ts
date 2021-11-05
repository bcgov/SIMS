export enum RecordTypeCodes {
  Header = 100,
  IndividualDataRecord = 200,
  ApplicationDataRecord = 300,
  RestrictionDataRecord = 400,
}

export class ProcessSftpResponseResult {
  summary: string[] = [];
  success: boolean;
}
