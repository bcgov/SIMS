import { RestrictionBypassBehaviors } from "@/types";

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
export interface AvailableStudentRestrictionAPIOutDTO {
  studentRestrictionId: number;
  restrictionCode: string;
  studentRestrictionCreatedAt: Date;
}

/**
 * Available student restrictions to bypass item.
 */
export interface AvailableStudentRestrictionsAPIOutDTO {
  availableRestrictionsToBypass: AvailableStudentRestrictionAPIOutDTO[];
}

/**
 * Student restriction details to bypass.
 */
export interface BypassRestrictionAPIInDTO {
  applicationId: number;
  studentRestrictionId: number;
  bypassBehavior: RestrictionBypassBehaviors;
  note: string;
}

/**
 * Student restriction details to remove bypass.
 */
export interface RemoveBypassRestrictionAPIInDTO {
  note: string;
}

/**
 * Application restriction bypass details.
 */
export interface ApplicationRestrictionBypassAPIOutDTO {
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
