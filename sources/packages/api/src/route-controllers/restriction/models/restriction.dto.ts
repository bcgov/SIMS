import { IsOptional, IsPositive, MaxLength } from "class-validator";
import { RestrictionNotificationType } from "../../../database/entities/restriction-notification-type.type";
import {
  NOTE_DESCRIPTION_MAX_LENGTH,
  RestrictionType,
} from "../../../database/entities";

/**
 * Base DTO for restriction.
 */
export class RestrictionBaseDTO {
  restrictionId: number;
  restrictionType: RestrictionType;
  restrictionCategory: string;
  restrictionCode: string;
  description: string;
}

/**
 * DTO class for student/institution restriction summary.
 */
export class RestrictionSummaryAPIOutDTO extends RestrictionBaseDTO {
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

/**
 * DTO class for student/institution restriction details.
 */
export class RestrictionDetailAPIOutDTO extends RestrictionSummaryAPIOutDTO {
  createdBy: string;
  updatedBy: string;
  restrictionNote: string;
  resolutionNote: string;
}

/**
 * DTO to resolve restriction to a student/institution.
 */
export class ResolveRestrictionAPIInDTO {
  @IsOptional()
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
 * This object is returned by controller.
 */
export class StudentRestrictionAPIOutDTO {
  /**
   * code is the Restriction code.
   */
  code: string;
  /**
   * type is the Notification type.
   */
  type: RestrictionNotificationType;
}
