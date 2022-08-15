import { IsOptional, IsPositive } from "class-validator";
import { RestrictionNotificationType } from "../../../database/entities/restriction-notification-type.type";
import { RestrictionType } from "../../../database/entities";

/**
 * Base DTO for restriction
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
   * code is the restriction code.
   */
  code: string;
  /**
   * type is the notification type.
   */
  type: RestrictionNotificationType;
}
