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
  /**
   * Triggered when the Institution creates an offering change request for the student
   * which requires student and SABC approval that will result in the assessment to be
   * recalculated due to a possible impact on the money that the student is receiving.
   */
  ApplicationOfferingChange = "Application offering change",
  /**
   * Triggered when a change in one application will cause an impact in a second application
   * which would lead to a need for a reassessment. For instance, when an application for
   * the same student and same program year is changed or cancelled, it may affect future
   * applications assessments due to adjustments in the program year maximums.
   * This trigger type will be created in any impacted application that would need the numbers
   * to be adjusted.
   */
  RelatedApplicationChanged = "Related application changed",
  /**
   * Triggered manually by a ministry user.
   */
  ManualReassessment = "Manual reassessment",
}
