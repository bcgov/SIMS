/**
 * Defines how forms can be grouped when submitted.
 */
export enum FormSubmissionGrouping {
  /**
   * An application bundle groups multiple forms together
   * as part of a single application process.
   */
  ApplicationBundle = "Application bundle",
  /**
   * A student standalone refers to forms that are submitted
   * independently and are associated directly with a student,
   * rather than an application.
   */
  StudentStandalone = "Student standalone",
}
