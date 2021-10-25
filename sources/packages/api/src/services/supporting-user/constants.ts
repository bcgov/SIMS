// These constants defines the possible errors that can happen while a supporting
// user is providing supporting data. These name/codes can be used also on the
// UI to determine how the errors should be displayed to the final user.

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
// date for his own application.
export const SUPPORTING_USER_IS_THE_STUDENT_FROM_APPLICATION =
  "SUPPORTING_USER_IS_THE_STUDENT_FROM_APPLICATION";
