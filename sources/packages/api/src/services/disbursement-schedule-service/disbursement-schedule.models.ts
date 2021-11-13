import { DisbursementValueType } from "../../database/entities";

export interface DisbursementValue {
  valueCode: string;
  valueType: DisbursementValueType;
  valueAmount: number;
}

export interface Disbursement {
  disbursementDate: Date;
  disbursements: DisbursementValue[];
}
