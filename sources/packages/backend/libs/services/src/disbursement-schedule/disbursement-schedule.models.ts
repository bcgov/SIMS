import {
  DisbursementSchedule,
  DisbursementValue,
  DisbursementValueType,
} from "@sims/sims-db";

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

export interface AwardValueWithRelatedSchedule {
  relatedSchedule: DisbursementSchedule;
  awardValue: DisbursementValue;
}
