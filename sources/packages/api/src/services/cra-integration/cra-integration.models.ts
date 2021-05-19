export const DATE_FORMAT = "YYYYMMDD";
export const FILLER = " ";

export enum TransactionCodes {
  MatchingRunHeader = "7000",
  MatchingRunRecord = "7001",
  MatchingRunFooter = "7002",
  IncomeRequestHeader = "7100",
  IncomeRequestRecord = "7101",
  IncomeRequestFooter = "7102",
}

export enum TransactionSubCodes {
  IVRequest = "0020",
}

export interface CraRecord {
  sin: string;
  individualSurname: string;
  individualGivenName: string;
  individualBirthDate: Date;
  taxYear?: number;
}
