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
  /**
   * Institution restriction type.
   */
  Institution = "Institution",
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
  Deleted = "Deleted",
}

/**
 * Types of action for restrictions.
 */
export enum RestrictionActionType {
  /**
   * No effect.
   */
  NoEffect = "No effect",
  /**
   * Stop full time BC funding.
   */
  StopFullTimeBCFunding = "Stop full time BC funding",
  /**
   * Stop part time BC funding.
   */
  StopPartTimeBCFunding = "Stop part time BC funding",
  /**
   * Stop student from applying part time applications.
   */
  StopPartTimeApply = "Stop part time apply",
  /**
   * Stop student from applying full time applications.
   */
  StopFullTimeApply = "Stop full time apply",
  /**
   * Stop all part time disbursements of the student.
   */
  StopPartTimeDisbursement = "Stop part time disbursement",
  /**
   * Stop all full time disbursements of the student.
   */
  StopFullTimeDisbursement = "Stop full time disbursement",
}

export interface RestrictionDetail {
  restrictionId: number;
  restrictionType: RestrictionType;
  restrictionCategory: string;
  restrictionCode: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  resolvedAt?: Date;
  deletedAt?: Date;
  updatedAt?: Date;
  createdBy: string;
  resolvedBy: string;
  deletedBy?: string;
  restrictionNote?: string;
  resolutionNote?: string;
  deletionNote?: string;
}
