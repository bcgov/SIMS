import { FieldRequirementType } from ".";

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
/**
 * Restriction metadata.
 */
export interface RestrictionMetadata {
  /**
   * The restricted party(student or institution) field requirements for the restriction.
   */
  fieldRequirements: Record<string, FieldRequirementType>;
}
