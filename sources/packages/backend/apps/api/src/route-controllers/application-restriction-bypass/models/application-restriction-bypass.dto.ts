import { RestrictionType } from "@sims/sims-db";

/**
 * Base DTO for application restriction bypass.
 */
export class ApplicationRestrictionBypassBaseAPIOutDTO {
  id: number;
  restrictionType: RestrictionType;
  restrictionCode: string;
}

/**
 * DTO class for aest application restriction bypass summary.
 */
export class ApplicationRestrictionBypassSummaryAPIOutDTO extends ApplicationRestrictionBypassBaseAPIOutDTO {
  createdAt: Date;
  isActive: boolean;
}
