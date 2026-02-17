/**
 * Enumeration types for Restriction.
 */
export enum RestrictionType {
  /**
   * Federal restriction type.
   */
  Federal = "Federal",
  /**
   * Provincial restriction type.
   */
  Provincial = "Provincial",
  /**
   * Institution restriction type.
   */
  Institution = "Institution",
}

export interface RestrictionMetadata {
  constraints: Record<string, string>;
}
