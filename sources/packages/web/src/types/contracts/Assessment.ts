/**
 * Possible status for an Assessment, when the Application_status is in Assessment
 */
 export enum AssessmentStatus {
  /**
   * An Assessment is required
   */
  required = "Required",
  /**
   * An Assessment is not required, not used in our current workflow but having it as an placeholder
   */
  notRequired = "Not Required",
  /**
   * An Assessment is Completed
   */
  completed = "Completed",
  /**
   * An Assessment is Declined,  not used in our current workflow but having it as an placeholder
   */
  declined = "Declined",
}
