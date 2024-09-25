import { RestrictionType } from "@/types";

/**
 * DTO class for AEST application restriction bypass summary.
 */
export class ApplicationRestrictionBypassSummary {
  id: number;
  restrictionType: RestrictionType;
  restrictionCode: string;
  isActive: boolean;
  isBypassActive: boolean;
}

/**
 * DTO class for AEST application restriction bypass history.
 */
export class ApplicationRestrictionBypassHistoryAPIOutDTO {
  bypasses: ApplicationRestrictionBypassSummary[];
}

/**
 * Indicates if the bypassed restriction is active or removed.
 */
export enum ApplicationRestrictionBypassStatus {
  /**
   * Bypassed restriction is active.
   */
  Active = "Active",
  /**
   * Bypassed restriction is removed.
   */
  Removed = "Removed",
}
