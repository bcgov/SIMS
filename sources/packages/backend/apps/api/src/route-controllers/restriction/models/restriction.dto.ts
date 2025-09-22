import { IsNotEmpty, IsPositive, MaxLength } from "class-validator";
import {
  RestrictionNotificationType,
  NOTE_DESCRIPTION_MAX_LENGTH,
  RestrictionType,
  RESTRICTION_CATEGORY_MAX_LENGTH,
} from "@sims/sims-db";

/**
 * Base DTO for restriction.
 */
export class RestrictionBaseAPIOutDTO {
  restrictionId: number;
  restrictionType: RestrictionType;
  restrictionCategory: string;
  restrictionCode: string;
  description: string;
}

/**
 * DTO class for institution restriction summary.
 */
export class RestrictionInstitutionSummaryAPIOutDTO extends RestrictionBaseAPIOutDTO {
  createdAt: Date;
  isActive: boolean;
}

/**
 * DTO class for student/institution restriction summary.
 */
export class RestrictionSummaryAPIOutDTO extends RestrictionBaseAPIOutDTO {
  createdAt: Date;
  isActive: boolean;
  resolvedAt?: Date;
  deletedAt?: Date;
}

/**
 * DTO class for institution restriction details.
 */
export class RestrictionInstitutionDetailAPIOutDTO extends RestrictionBaseAPIOutDTO {
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
  restrictionNote: string;
}

/**
 * DTO class for student/institution restriction details.
 */
export class RestrictionDetailAPIOutDTO extends RestrictionSummaryAPIOutDTO {
  createdBy: string;
  resolvedBy: string;
  deletedBy?: string;
  restrictionNote?: string;
  resolutionNote?: string;
  deletionNote?: string;
}

/**
 * DTO to resolve restriction to a student/institution.
 */
export class ResolveRestrictionAPIInDTO {
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  noteDescription: string;
}

/**
 * Delete a restriction from a student.
 */
export class DeleteRestrictionAPIInDTO {
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  noteDescription: string;
}

/**
 * DTO to add restriction to a student/institution.
 */
export class AssignRestrictionAPIInDTO extends ResolveRestrictionAPIInDTO {
  @IsPositive()
  restrictionId: number;
}

/**
 * DTO to identify if a student/institution has valid restriction assigned.
 */
export class RestrictionStatusAPIOutDTO {
  isActive: boolean;
}

/**
 * DTO for student restriction.
 * This object is returned by api.
 */
export class StudentRestrictionAPIOutDTO {
  /**
   * Restriction code.
   */
  code: string;
  /**
   * Notification type.
   */
  type: RestrictionNotificationType;
}

export class RestrictionCategoryParamAPIInDTO {
  @MaxLength(RESTRICTION_CATEGORY_MAX_LENGTH)
  restrictionCategory: string;
}
