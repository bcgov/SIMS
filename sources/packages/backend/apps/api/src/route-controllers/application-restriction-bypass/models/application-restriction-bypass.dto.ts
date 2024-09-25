import { RestrictionType } from "@sims/sims-db";

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
