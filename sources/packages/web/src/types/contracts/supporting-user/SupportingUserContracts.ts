// Expected possible errors returned by the API while submitting supporting data.
// Not possible to find a Student Application with the data provided by the supporting user.
export const STUDENT_APPLICATION_NOT_FOUND = "STUDENT_APPLICATION_NOT_FOUND";
// The same user currently authenticated already provided supporting data for the
// Student Application.
export const SUPPORTING_USER_ALREADY_PROVIDED_DATA =
  "SUPPORTING_USER_ALREADY_PROVIDED_DATA";
// The same supporting user type (parent/partner) already provided supporting data for the
// Student Application.
export const SUPPORTING_USER_TYPE_ALREADY_PROVIDED_DATA =
  "SUPPORTING_USER_TYPE_ALREADY_PROVIDED_DATA";
// The user currently authenticated is the student and the student cannot provide supporting
// data for his own application.
export const SUPPORTING_USER_IS_THE_STUDENT_FROM_APPLICATION =
  "SUPPORTING_USER_IS_THE_STUDENT_FROM_APPLICATION";

/**
 * Types of users that provides supporting information
 * for the Student Application.
 */
export enum SupportingUserType {
  /**
   * Parent of a student submitting an application.
   */
  Parent = "Parent",
  /**
   * Partner of a student submitting an application.
   */
  Partner = "Partner",
}
