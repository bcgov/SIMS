import { DisbursementValueType } from "@sims/sims-db";

export interface DisbursementValue {
  valueCode: string;
  valueType: DisbursementValueType;
  valueAmount: number;
}

export interface Disbursement {
  disbursementDate: string;
  negotiatedExpiryDate: string;
  disbursements: DisbursementValue[];
}
