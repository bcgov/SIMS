export interface DisbursementReceiptGrantModel {
  grantType: string;
  grantAmount: string;
}

export interface DisbursementReceiptModel {
  documentNumber: number;
  studentSIN: string;
  fundingType: string;
  totalEntitledDisbursedAmount: string;
  totalDisbursedAmount: string;
  disburseDate: Date;
  disburseAmountStudent: string;
  disburseAmountInstitution: string;
  dateSignedInstitution: Date;
  institutionCode: string;
  disburseMethodStudent: string;
  studyPeriodEndDate: Date;
  totalEntitledGrantAmount: string;
  totalDisbursedGrantAmount: string;
  totalDisbursedGrantAmountStudent: string;
  totalDisbursedGrantAmountInstitution: string;
  grants: DisbursementReceiptGrantModel[];
}

export interface DailyDisbursementTotalRecords {
  "BC Student Loan": number;
  "BC Student Grant": number;
  "BC Total": number;
  "Total Records": number;
}
