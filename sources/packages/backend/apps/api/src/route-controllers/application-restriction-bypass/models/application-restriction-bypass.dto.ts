/**
 * DTO class for application restriction bypass summary.
 */
export class ApplicationRestrictionBypassSummary {
  id: number;
  restrictionCategory: string;
  restrictionCode: string;
  isRestrictionActive: boolean;
  isBypassActive: boolean;
}

/**
 * DTO class for application restriction bypass history.
 */
export class ApplicationRestrictionBypassHistoryAPIOutDTO {
  bypasses: ApplicationRestrictionBypassSummary[];
}
