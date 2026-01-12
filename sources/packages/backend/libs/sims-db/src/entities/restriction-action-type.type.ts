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
   * Stop all part-time disbursements of the student.
   */
  StopPartTimeDisbursement = "Stop part-time disbursement",
  /**
   * Stop all full-time disbursements of the student.
   */
  StopFullTimeDisbursement = "Stop full-time disbursement",
  /**
   * Stop the creation of new offerings for the institution.
   */
  StopOfferingCreate = "Stop offering create",
}
