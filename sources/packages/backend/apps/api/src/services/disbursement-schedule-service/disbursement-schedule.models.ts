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
  /**
   * The ones considered inside a 21 days period
   * prior to the offering start date, that allow
   * them to be approved.
   */
  Current = "current",
  /**
   * The ones not yet inside a 21 days period
   * prior to the offering start date, that allow
   * them to be approved.
   */
  Upcoming = "upcoming",
}

export interface ECertDisbursementSchedule extends DisbursementSchedule {
  stopFullTimeBCFunding: boolean;
}
