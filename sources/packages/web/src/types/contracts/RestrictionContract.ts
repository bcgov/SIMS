/**
 * DTO interface for student restriction summary.
 */
export interface StudentRestrictionSummary {
  restrictionType: RestrictionType;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
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
