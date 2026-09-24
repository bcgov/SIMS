/**
 * Processing result of an application included in a batch manual reassessment.
 */
export enum BatchReassessmentApplicationResult {
  /**
   * The application was manually reassessed successfully.
   */
  Success = "Success",
  /**
   * The application failed manual reassessment processing.
   */
  Failure = "Failure",
}
