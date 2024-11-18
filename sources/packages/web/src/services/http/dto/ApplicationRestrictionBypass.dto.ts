/**
 * Application restriction bypass summary.
 */
export interface ApplicationRestrictionBypassSummary {
  id: number;
  restrictionType: string;
  restrictionCode: string;
  restrictionCategory: boolean;
  isRestrictionActive: boolean;
  isBypassActive: boolean;
}

/**
 * Application restriction bypass history.
 */
export interface ApplicationRestrictionBypassHistoryAPIOutDTO {
  bypasses: ApplicationRestrictionBypassSummary[];
}

/**
 * Available student restrictions to bypass.
 */
export class AvailableStudentRestrictionAPIOutDTO {
  studentRestrictionId: number;
  restrictionCode: string;
  studentRestrictionCreatedAt: Date;
}

/**
 * Available student restrictions to bypass item.
 */
export class AvailableStudentRestrictionsAPIOutDTO {
  availableRestrictionsToBypass: AvailableStudentRestrictionAPIOutDTO[];
}

/**
 * Student restriction details to bypass.
 */
export class BypassRestrictionAPIInDTO {
  applicationId: number;
  studentRestrictionId: number;
  bypassBehavior: RestrictionBypassBehaviors;
  note: string;
}

/**
 * Student restriction details to remove bypass.
 */
export class RemoveBypassRestrictionAPIInDTO {
  note: string;
}

/**
 * Application restriction bypass details.
 */
export class ApplicationRestrictionBypassAPIOutDTO {
  applicationRestrictionBypassId: number;
  studentRestrictionId: number;
  restrictionCode: string;
  createdDate: Date;
  createdBy: string;
  creationNote: string;
  removedDate?: string;
  removedBy?: string;
  removalNote?: string;
  bypassBehavior: string;
}

/**
 * Defines how the bypass should behave, for instance, until when it will be valid.
 */
export enum RestrictionBypassBehaviors {
  /**
   * Any disbursement associated with the application will have the restriction
   * ignored if the bypass is active. Any reassessment will continue to ignore
   * the restrictions.
   */
  AllDisbursements = "All disbursements",
  /**
   * When the next e-Cert is marked as 'Ready to send' the bypass should be removed.
   */
  NextDisbursementOnly = "Next disbursement only",
}
