/**
 * Types of action for restrictions.
 */
export enum RestrictionActionType {
  /**
   * No effect.
   */
  NoEffect = "No effect",
  /**
   * Stop all BC funding.
   */
  StopBCFunding = "Stop BC funding",
  /**
   * Stop student from applying applications.
   */
  StopApply = "Stop apply",
  /**
   * Stop all disbursement of the student.
   */
  StopDisbursement = "Stop disbursement",
}
