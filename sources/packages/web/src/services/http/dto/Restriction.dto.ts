import { RestrictionType } from "@/types";

/**
 * Base DTO for restriction
 */
export interface RestrictionBaseDTO {
  restrictionId: number;
  restrictionType: RestrictionType;
  restrictionCategory: string;
  restrictionCode: string;
  description: string;
}

/**
 * DTO interface for student/institution restriction summary.
 */
export interface RestrictionSummaryAPIOutDTO extends RestrictionBaseDTO {
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

/**
 * DTO interface for student/institution restriction details.
 */
export interface RestrictionDetailAPIOutDTO
  extends RestrictionSummaryAPIOutDTO {
  createdBy: string;
  updatedBy: string;
  restrictionNote: string;
  resolutionNote: string;
}

/**
 * DTO to resolve restriction to a student/institution.
 */
export interface ResolveRestrictionAPIInDTO {
  noteDescription: string;
}

/**
 * DTO to add restriction to a student/institution.
 */
export interface AssignRestrictionAPIInDTO extends ResolveRestrictionAPIInDTO {
  restrictionId: number;
}
