/**
 * Possible scholastic standing changes types reported by an institution when the
 * program enrolled by the student was not completed as expected and the institution
 * must report the change to the Ministry.
 */
export enum StudentScholasticStandingChangeType {
  /**
   * Student is transferring to a different institution or campus.
   */
  StudentTransfer = "Student transfer",
  /**
   * Student completed the offering before the expected time.
   */
  StudentCompletedProgramEarly = "Student completed program early",
  /**
   * Student was not able to complete the program (fail to complete).
   *!This scholastic standing type does not causes an reassessment.
   */
  StudentDidNotCompleteProgram = "Student did not complete program",
  /**
   * Student withdrew from program.
   */
  StudentWithdrewFromProgram = "Student withdrew from program",
}
