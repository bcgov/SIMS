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

export interface UpdateSupportingUserDTO {
  applicationNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  country: string;
  phone: string;
  postalCode: string;
  provinceState: string;
  sin: string;
  studentsDateOfBirth: Date;
  studentsLastName: string;
  supportingData: any;
}
