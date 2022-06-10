import {
  DisbursementSchedule,
  DisbursementValueType,
} from "../../database/entities";

export interface DisbursementValue {
  valueCode: string;
  valueType: DisbursementValueType;
  valueAmount: number;
}

export interface Disbursement {
  disbursementDate: Date;
  negotiatedExpiryDate: Date;
  disbursements: DisbursementValue[];
}

/**
 * Enum for COE enrollment period.
 */
export enum EnrollmentPeriod {
  Current = "current",
  Upcoming = "upcoming",
}

export interface ECertDisbursementSchedule extends DisbursementSchedule {
  stopFullTimeBCFunding: boolean;
}
