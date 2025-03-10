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

export interface ECertDisbursementSchedule extends DisbursementSchedule {
  stopFullTimeBCFunding: boolean;
}

/**
 * COE approval period status.
 */
export enum COEApprovalPeriodStatus {
  /**
   * COE is within its valid approval period and can be approved.
   */
  WithinApprovalPeriod = "Within approval period",
  /**
   * COE is currently before its approval period
   * and needs to wait until approval period to be confirmed.
   */
  BeforeApprovalPeriod = "Before approval period",
  /**
   * The COE is currently crossed its approval period and cannot be confirmed by institution.
   */
  AfterApprovalPeriod = "After approval period",
}
