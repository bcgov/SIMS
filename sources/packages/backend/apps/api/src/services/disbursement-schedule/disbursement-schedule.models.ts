import { DisbursementSchedule, DisbursementValueType } from "@sims/sims-db";

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

/**
 * COE approval period status.
 */
export enum COEApprovalPeriodStatus {
  /**
   * COE is within it's valid approval period and can be approved.
   */
  WithinApprovalPeriod = "Within approval period",
  /**
   * COE is currently before it's approval period
   * and needs to wait until approval period to be confirmed.
   */
  BeforeApprovalPeriod = "Before approval period",
  /**
   * The COE is currently crossed it's approval period and cannot be confirmed by institution.
   */
  AfterApprovalPeriod = "After approval period",
}
