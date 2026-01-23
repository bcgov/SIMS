import { OfferingIntensity } from "@/types";

export interface AssessmentDetailHeader {
  applicationNumber: string;
  institutionName: string;
  offeringIntensity: OfferingIntensity;
  offeringStudyStartDate: string;
  offeringStudyEndDate: string;
}

/**
 * Type of award to be displayed in the awards table.
 */
export enum AwardTableType {
  Estimated = "Estimated",
  Final = "Final",
}

/**
 * Adjustments that were made to an award.
 */
export interface AwardAdjustmentAmounts {
  /**
   * Value amount already disbursed for the same application and
   * the same award that was subtracted from the calculated award.
   */
  disbursedAmountSubtracted: number;
  /**
   * Overaward amount value subtracted from the award calculated.
   */
  overawardAmountSubtracted: number;
  /**
   * Restriction amount value subtracted from the award calculated.
   */
  restrictionAmountSubtracted: number;
}
