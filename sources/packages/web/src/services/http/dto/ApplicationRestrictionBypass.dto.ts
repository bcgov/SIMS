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
