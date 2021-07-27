/**
 * Possible status for a Program Information Request (PIR).
 */
export enum ProgramInfoStatus {
  /**
   * The PIR must happen to complete an offering id
   * be provided by the institution.
   */
  required = "required",
  /**
   * The offering id is present and no action
   * from institution is needed.
   */
  notRequired = "not required",
  /**
   * The PIR was previously required and it is now
   * populated with an offering id.
   */
  completed = "completed",
}
