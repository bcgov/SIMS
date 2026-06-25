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
   * Prevent a student from selecting an institution in a part-time applications.
   * The institution should not be available to select in the part-time application.
   */
  StopPartTimeApplicationSelection = "Stop part-time application selection",
  /**
   * Prevent a student from selecting an institution in a full-time applications.
   * The institution should not be available to select in the full-time application.
   */
  StopFullTimeApplicationSelection = "Stop full-time application selection",
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
