/**
 * Identifies what was the reason to the assessment happen. Usually one completed
 * Student Application will have only one record of type "Original assessment".
 * The other types are related to reassessments that happened after the Student
 * Application was completed, for instance, due to a student appeal.
 */
export enum AssessmentTriggerType {
  /**
   * Triggered on the first time when a Student Application assessment
   * workflow is executed and the NOA is calculated.
   */
  OriginalAssessment = "Original assessment",
  /**
   * Triggered when the Institution reported a change in the student
   * scholastic standing like an early completion or a withdrawal.
   */
  ScholasticStandingChange = "Scholastic standing change",
  /**
   * Triggered when the Institution needs to change some information on a
   * program that will affect current active applications in a way that the
   * assessment need to be recalculated due to a possible impact in the money
   * that the student is receiving.
   */
  ProgramChange = "Program change",
  /**
   * Triggered when the Institution needs to change some information on an
   * offering that will affect current active applications in a way that the
   * assessment need to be recalculated due to a possible impact in the money
   * that the student is receiving.
   */
  OfferingChange = "Offering change",
  /**
   * Triggered when the student requested some change in the application in a way
   * that the assessment need to be recalculated due to a possible impact in the
   * money that the student is receiving, for instance, an income change or some
   * changes related to dependents.
   */
  StudentAppeal = "Student appeal",
}
