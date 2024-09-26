/**
 * AEST application restriction bypass summary.
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
 * AEST application restriction bypass history.
 */
export interface ApplicationRestrictionBypassHistoryAPIOutDTO {
  bypasses: ApplicationRestrictionBypassSummary[];
}
