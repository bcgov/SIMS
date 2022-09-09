/**
 * Possible status for a Program Information Request (PIR).
 */
export enum ProgramInfoStatus {
  /**
   * The PIR must happen to an offering id
   * be provided by the institution.
   */
  required = "Required",
  /**
   * The offering id is present and no action
   * from institution is needed.
   */
  notRequired = "Not Required",
  /**
   * The PIR was completed by the institution.
   */
  submitted = "Submitted",
  /**
   * The PIR was previously required and it is now
   * populated with an offering id.
   */
  completed = "Completed",
  /**
   * The PIR was declined by the institution.
   */
  declined = "Declined",
}
/**
 * Model for approve program info request.
 */
export class ApproveProgramInfoRequestModel {
  requestedTuitionRemittance = null;
  tuitionRemittance = null;
}
