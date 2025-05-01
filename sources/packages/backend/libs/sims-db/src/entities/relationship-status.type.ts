/**
 * Possible relationship status, for an Application
 */
export enum RelationshipStatus {
  /**
   * The student who submits the application realtionship status is Married
   */
  Married = "married",
  /**
   * The student who submits the application realtionship status is Single
   */
  Single = "single",
  /**
   * The student who submits the application realtionship status is other than married and single
   */
  Other = "other",
  /**
   * Married/common-law and unable to provide partner income due to domestic abuse
   */
  MarriedUnable = "marriedUnable",
}
