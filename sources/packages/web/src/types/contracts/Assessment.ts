import { OfferingIntensity } from "@/types";

export interface AssessmentDetailHeader {
  applicationNumber: string;
  institutionName: string;
  offeringIntensity: OfferingIntensity;
  offeringStudyStartDate: string;
  offeringStudyEndDate: string;
}

/**
 * Type of adjustment that was made to an award.
 */
export interface AwardAdjustmentType {
  /**
   * A restriction resulted in a decreased award.
   */
  restriction: boolean;
  /**
   * A previous disbursed amount resulted in a decreased award.
   */
  disbursed: boolean;
  /**
   * A positive overaward resulted in a decreased award.
   */
  positiveOveraward: boolean;
  /**
   * A negative overaward resulted in an increased award.
   */
  negativeOveraward: boolean;
}

export interface AssessmentAwardData {
  awardType: string;
  awardTypeDisplay: string;
  awardDescription: string;
  estimatedAmount: string | number;
  finalAmount?: string | number;
  hasRestrictionAdjustment: boolean;
  hasDisbursedAdjustment: boolean;
  hasPositiveOverawardAdjustment: boolean;
  hasNegativeOverawardAdjustment: boolean;
}

/**
 *  Disbursement status label.
 */
export enum DisbursementStatusBadgeLabel {
  Cancelled = "Cancelled",
  Pending = "Pending",
  Sent = "Sent",
}
