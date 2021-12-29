/**
 * Base DTO for restriction
 */
export interface RestrictionBaseDTO {
  restrictionId: number;
  restrictionType: RestrictionType;
  restrictionCategory: string;
  description: string;
}

/**
 * DTO interface for student restriction summary.
 */
export interface StudentRestrictionSummary extends RestrictionBaseDTO {
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

/**
 * DTO interface for student restriction details.
 */
export interface StudentRestrictionDetail extends StudentRestrictionSummary {
  createdBy: string;
  updatedBy: string;
  restrictionNote: string;
  resolutionNote: string;
}

/**
 * DTO to add or resolve restriction to a student/institution.
 */
export interface UpdateRestrictionDTO {
  noteDescription: string;
}

/**
 * Enumeration types for Restriction.
 */
export enum RestrictionType {
  /**
   * Federal restriction type
   */
  Federal = "Federal",
  /**
   * Provincial restriction type
   */
  Provincial = "Provincial",
}
