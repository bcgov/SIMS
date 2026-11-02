/**
 * Server-side information required by the backend-only validations,
 * provided to the AJV custom keywords as the validation context (passContext).
 */
export interface EducationProgramDataValidationContext {
  /**
   * Institution the program belongs to.
   */
  institutionId: number;
  /**
   * Program year the program belongs to.
   */
  programYearId: number;
  /**
   * Program being updated, not present when the program is being created.
   */
  programId?: number;
}
