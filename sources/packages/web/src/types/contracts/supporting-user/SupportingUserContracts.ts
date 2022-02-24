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

/**
 * Information used to uniquely identify a Student Application.
 * The application must be search using at least 3 criteria as
 * per defined by the Ministry policies.
 */
export interface ApplicationIdentifierDTO {
  applicationNumber: string;
  studentsDateOfBirth: Date;
  studentsLastName: string;
}

/**
 * Data required to update a supporting user.
 * The validation of the entire model will (and
 * must) be done by the Form.IO dry run.
 */
export interface UpdateSupportingUserDTO extends ApplicationIdentifierDTO {
  addressLine1: string;
  addressLine2: string;
  city: string;
  country: string;
  phone: string;
  postalCode: string;
  provinceState: string;
  sin: string;
  supportingData: any;
}

export interface GetApplicationDTO {
  programYearStartDate: Date;
  formName: string;
}

export interface ApplicationSupportingUsersDTO {
  supportingUserId: number;
  supportingUserType: SupportingUserType;
}

export interface SupportingUserFormData {
  formName: string;
  formData: any;
}
