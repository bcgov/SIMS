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
 * Enumeration for restricted party.
 */
export enum RestrictedParty {
  /**
   * Student restricted party.
   */
  Student = "Student",
  /**
   * Institution restricted party.
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
 *  Restriction badge label.
 */
export enum RestrictionBadgeLabel {
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
   * Stop full-time BC loan (BCSL).
   */
  StopFullTimeBCLoan = "Stop full-time BC loan",
  /**
   * Stop full-time BC grants (BCAG, BGPD, SBSD).
   */
  StopFullTimeBCGrants = "Stop full-time BC grants",
  /**
   * Stop part-time BC grants (BCAG, SBSD).
   */
  StopPartTimeBCGrants = "Stop part-time BC grants",
  /**
   * Stop student from applying part-time applications.
   */
  StopPartTimeApply = "Stop part-time apply",
  /**
   * Stop student from applying full-time applications.
   */
  StopFullTimeApply = "Stop full-time apply",
  /**
   * Prevent a student from selecting an institution in a part-time application.
   * The institution should not be available to select in the part-time application.
   */
  StopPartTimeApplicationEligibility = "Stop part-time application eligibility",
  /**
   * Prevent a student from selecting an institution in a full-time application.
   * The institution should not be available to select in the full-time application.
   */
  StopFullTimeApplicationEligibility = "Stop full-time application eligibility",
  /**
   * Stop all part-time disbursements of the student.
   */
  StopPartTimeDisbursement = "Stop part-time disbursement",
  /**
   * Stop all full-time disbursements of the student.
   */
  StopFullTimeDisbursement = "Stop full-time disbursement",
  /**
   * Stop the student from accepting part-time assessments.
   */
  StopPartTimeAcceptAssessment = "Stop part-time accept assessment",
  /**
   * Stop the student from accepting full-time assessments.
   */
  StopFullTimeAcceptAssessment = "Stop full-time accept assessment",
  /**
   * Stop the creation of new offerings for the institution.
   */
  StopOfferingCreate = "Stop offering create",
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

/**
 * Field requirement types.
 */
export enum FieldRequirementType {
  /**
   * The field is required and must be provided.
   */
  Required = "required",
  /**
   * The field is not allowed and must not be provided.
   */
  NotAllowed = "not allowed",
}

/**
 * Restriction codes that are used for specific UI scenarios,
 * for instance, to display a specific content based on a restriction code.
 */
export enum RestrictionCode {
  /**
   * Institution under review.
   */
  InstitutionUnderReview = "IUR",
}

/**
 * Possible visualization scopes for institution restrictions.
 * This is used to determine where the restriction should be displayed.
 * For example, if a restriction is only applicable to a specific program,
 * then it should only be displayed on the program page.
 */
export enum InstitutionRestrictionDisplayScope {
  Institution = "institution",
  Location = "location",
  Program = "program",
}
