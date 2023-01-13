export interface DisbursementReceiptGrantModel {
  grantType: string;
  grantAmount: number;
}

export interface DisbursementReceiptModel {
  documentNumber: number;
  studentSIN: string;
  fundingType: string;
  totalEntitledDisbursedAmount: number;
  totalDisbursedAmount: number;
  disburseDate: Date;
  disburseAmountStudent: number;
  disburseAmountInstitution: number;
  dateSignedInstitution: Date;
  institutionCode: string;
  disburseMethodStudent: string;
  studyPeriodEndDate: Date;
  totalEntitledGrantAmount: number;
  totalDisbursedGrantAmount: number;
  totalDisbursedGrantAmountStudent: number;
  totalDisbursedGrantAmountInstitution: number;
  grants: DisbursementReceiptGrantModel[];
}
