/**
 * Defines the category of forms.
 */
export enum FormCategory {
  /**
   * Appeals related forms.
   */
  StudentAppeal = "Student appeal",
  /**
   * Any form submitted by a student that does not fall under
   * the appeals process and have multiple applications.
   */
  StudentForm = "Student form",
  /**
   * Forms used along the system that are not directly
   * selected by students.
   */
  System = "System",
}
