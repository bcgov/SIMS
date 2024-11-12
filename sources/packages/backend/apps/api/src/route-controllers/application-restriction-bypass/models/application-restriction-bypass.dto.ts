import {
  NOTE_DESCRIPTION_MAX_LENGTH,
  RestrictionBypassBehaviors,
} from "@sims/sims-db";
import { IsPositive, IsEnum, MaxLength, IsNotEmpty } from "class-validator";

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
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  note: string;
}

export class RemoveBypassRestrictionAPIInDTO {
  @IsNotEmpty()
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
  createdDate: string;
  createdBy: string;
  creationNote: string;
  removedDate?: string;
  removedBy?: string;
  removalNote?: string;
  bypassBehavior: string;
}
