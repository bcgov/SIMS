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
/**
 * Enumeration for restriction entity
 */
export enum RestrictionEntityType {
  /**
   * Student entity type
   */
  Student = "Student",
  /**
   * Institution entity type
   */
  Institution = "Institution",
}

/**
 * Types of notification for restrictions.
 */
export enum RestrictionNotificationType {
  /**
   * No effect.
   */
  NoEffect = "No effect",
  /**
   * Warning.
   */
  Warning = "Warning",
  /**
   * Error.
   */
  Error = "Error",
}
