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

/**
 *  Student restriction badge.
 */
export enum StudentRestrictionStatus {
  NoRestriction = "No restrictions",
  Restriction = "Active restrictions",
}

/**
 *  Restriction chip for datatable.
 */
export enum RestrictionStatus {
  Active = "Active",
  Resolved = "Resolved",
}
