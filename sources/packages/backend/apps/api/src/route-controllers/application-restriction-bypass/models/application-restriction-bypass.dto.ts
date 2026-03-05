import { RestrictedParty } from "@sims/services";
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
  restrictionDeletedAt?: Date;
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
  restrictionId: number;
  @IsEnum(RestrictedParty)
  restrictionType: RestrictedParty.Student | RestrictedParty.Institution;
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

export class AvailableRestrictionAPIOutDTO {
  restrictionId: number;
  restrictionType: RestrictedParty.Student | RestrictedParty.Institution;
  restrictionCode: string;
  restrictionCreatedAt: Date;
}

export class AvailableRestrictionsAPIOutDTO {
  availableRestrictionsToBypass: AvailableRestrictionAPIOutDTO[];
}

export class ApplicationRestrictionBypassAPIOutDTO {
  applicationRestrictionBypassId: number;
  restrictionId: number;
  restrictionCode: string;
  restrictionType: RestrictedParty.Student | RestrictedParty.Institution;
  createdDate: string;
  createdBy: string;
  creationNote: string;
  removedDate?: string;
  removedBy?: string;
  removalNote?: string;
  bypassBehavior: string;
}
