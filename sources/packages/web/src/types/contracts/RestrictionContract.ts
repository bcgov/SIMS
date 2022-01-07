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
 * DTO interface for student/institution restriction summary.
 */
export interface RestrictionSummaryDTO extends RestrictionBaseDTO {
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

/**
 * DTO interface for student/institution restriction details.
 */
export interface RestrictionDetailDTO extends RestrictionSummaryDTO {
  createdBy: string;
  updatedBy: string;
  restrictionNote: string;
  resolutionNote: string;
}

/**
 * DTO to resolve restriction to a student/institution.
 */
export interface ResolveRestrictionDTO {
  noteDescription: string;
}

/**
 * DTO to add restriction to a student/institution.
 */
export interface AssignRestrictionDTO extends ResolveRestrictionDTO {
  restrictionId: number;
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
