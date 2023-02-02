/**
 * Possible known types of the SIN check status.
 */
export enum SINCheckStatus {
  /**
   * Passed electronic or manual validation.
   */
  Passed = "1",
  /**
   * Under review.
   */
  UnderReview = "2",
  /**
   * Rejected because SIN is invalid (has not been issued, has been cancelled
   * or has been issued to completely different person).
   */
  RejectedBecauseHasInvalidSIN = "3",
  /**
   * Rejected because SIN and associated data (name, birthdate, gender) are not an
   * exact match. One or all of the associated data items is sufficiently different
   * from what is on the SIN Registry to put the validity in question.
   */
  RejectedBecauseSINAssociatedData = "4",
  /**
   * SIN is being used in a fraudulent manner. At this time, SSB will not
   * actually receive this status.
   */
  Fraud = "5",
}

/**
 * Flag returned from ESDC to indicate the status
 * of certain data that was sent (name, birthdate, gender).
 */
export enum OkayFlag {
  Yes = "Y",
  No = "N",
}
