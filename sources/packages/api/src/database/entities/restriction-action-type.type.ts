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
   * Stop student from applying part time applications.
   */
  StopPartTimeApply = "Stop part time apply",
  /**
   * Stop student from applying full time applications.
   */
  StopFullTimeApply = "Stop full time apply",
  /**
   * Stop all part time disbursement of the student.
   */
  StopPartTimeDisbursement = "Stop part time disbursement",
  /**
   * Stop all full time disbursement of the student.
   */
  StopFullTimeDisbursement = "Stop full time disbursement",
}
