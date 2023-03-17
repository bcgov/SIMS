/**
 * Possible scholastic standing changes types reported by an institution when the
 * program enrolled by the student was not completed as expected and the institution
 * must report the change to the Ministry.
 */
export enum StudentScholasticStandingChangeType {
  /**
   * Student went from full-time to part-time studies (vice-versa) or started a different program.
   * This scholastic standing change type is only used to finish the current application. changing
   * from full-time to part-time studies (vice-versa) is not part of the scholastic standing change.
   */
  ChangeInIntensity = "Change in intensity",
  /**
   * Student completed the offering before the expected time.
   */
  StudentCompletedProgramEarly = "Student completed program early",
  /**
   * Student was not able to complete the program (fail to complete).
   *!This scholastic standing type does not cause a reassessment.
   */
  StudentDidNotCompleteProgram = "Student did not complete program",
  /**
   * Student withdrew from program.
   */
  StudentWithdrewFromProgram = "Student withdrew from program",
}
