import { RestrictedParty, RestrictionBypassBehaviors } from "@/types";

/**
 * Application restriction bypass summary.
 */
export interface ApplicationRestrictionBypassSummary {
  id: number;
  restrictionType: string;
  restrictionCode: string;
  restrictionCategory: boolean;
  isRestrictionActive: boolean;
  restrictionDeletedAt?: Date;
  isBypassActive: boolean;
}

/**
 * Application restriction bypass history.
 */
export interface ApplicationRestrictionBypassHistoryAPIOutDTO {
  bypasses: ApplicationRestrictionBypassSummary[];
}

/**
 * Available restrictions to bypass.
 */
export interface AvailableRestrictionAPIOutDTO {
  restrictionId: number;
  restrictionCode: string;
  restrictionCreatedAt: Date;
  restrictionType: RestrictedParty.Student | RestrictedParty.Institution;
}

/**
 * Available restrictions to bypass item.
 */
export interface AvailableRestrictionsAPIOutDTO {
  availableRestrictionsToBypass: AvailableRestrictionAPIOutDTO[];
}

/**
 * Student restriction details to bypass.
 */
export interface BypassRestrictionAPIInDTO {
  applicationId: number;
  restrictionId: number;
  restrictionType: RestrictedParty.Student | RestrictedParty.Institution;
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
  restrictionId: number;
  restrictionCode: string;
  restrictionType: RestrictedParty.Student | RestrictedParty.Institution;
  createdDate: Date;
  createdBy: string;
  creationNote: string;
  removedDate?: string;
  removedBy?: string;
  removalNote?: string;
  bypassBehavior: string;
}
