import { ECertDisbursementSchedule } from "@sims/integrations/services";
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

export interface AwardValueWithRelatedSchedule {
  relatedSchedule: ECertDisbursementSchedule;
  awardValue: DisbursementValue;
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
