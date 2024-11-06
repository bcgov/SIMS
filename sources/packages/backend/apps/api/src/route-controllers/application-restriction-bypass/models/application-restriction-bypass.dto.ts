import {
  NOTE_DESCRIPTION_MAX_LENGTH,
  RestrictionBypassBehaviors,
} from "@sims/sims-db";
import { IsPositive, IsEnum, IsString, MaxLength } from "class-validator";

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

export class BypassRestrictionAPIInDTO {
  @IsPositive()
  applicationId: number;
  @IsPositive()
  studentRestrictionId: number;
  @IsEnum(RestrictionBypassBehaviors)
  bypassBehavior: RestrictionBypassBehaviors;
  @IsString()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  note: string;
}

export class RemoveBypassRestrictionAPIInDTO {
  @IsString()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  note: string;
}

export class AvailableStudentRestrictionAPIOutDTO {
  availableRestrictionsToBypass: {
    studentRestrictionId: number;
    restrictionCode: string;
    studentRestrictionCreatedAt: Date;
  }[];
}
export class ApplicationRestrictionBypassAPIOutDTO {
  applicationRestrictionBypassId: number;
  studentRestrictionId: number;
  restrictionCode: string;
  applicationRestrictionBypassCreatedDate: string;
  applicationRestrictionBypassCreatedBy: string;
  applicationRestrictionBypassCreationNote: string;
  applicationRestrictionBypassRemovedDate?: string;
  applicationRestrictionBypassRemovedBy?: string;
  applicationRestrictionBypassRemovalNote?: string;
  applicationRestrictionBypassBehavior: string;
}
