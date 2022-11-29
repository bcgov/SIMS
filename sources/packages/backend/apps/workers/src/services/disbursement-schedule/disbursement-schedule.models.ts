import { DisbursementValue, DisbursementValueType } from "@sims/sims-db";

export interface DisbursementSaveValue {
  valueCode: string;
  valueType: DisbursementValueType;
  valueAmount: number;
}

export interface DisbursementSaveModel {
  disbursementDate: string;
  negotiatedExpiryDate: string;
  disbursements: DisbursementSaveValue[];
}

export interface DisbursementScheduleValue {
  disbursementScheduleId: number;
  disbursementValue: DisbursementValue;
}
