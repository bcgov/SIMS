export interface Student {
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
}

export interface CreateStudent extends Student {
  sinNumber?: string;
}

export interface StudentContact {
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
}

export interface StudentInfo {
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  dateOfBirth: Date;
  contact: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    provinceState: string;
    country: string;
    postalCode: string;
    phone: string;
  };
  pdVerified: boolean;
  validSin: boolean;
  sin: string;
  pdSentDate: string;
  pdUpdatedDate: string;
  pdStatus: string;
}

export interface StudentProfile {
  phone: string;
  sinNumber?: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
}

export interface StudentFormInfo extends StudentInfo {
  birthDateFormatted: string;
  birthDateFormatted2: string;
}

export interface StudentApplication {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  id: number;
  applicationName: string;
  award: string;
  status: string;
}

/**
 * DTO object which is returned by student restriction API.
 */
export interface StudentRestrictionStatus {
  hasRestriction: boolean;
  hasFederalRestriction: boolean;
  hasProvincialRestriction: boolean;
  restrictionMessage: string;
}

/**
 * Enumeration for student permanent disability status.
 */
export enum StudentPDStatus {
  Yes = "Yes",
  No = "No",
  NotRequested = "Not Requested",
  Pending = "Pending",
}

/**
 * Enumeration for student sin status.
 */
export enum SINStatusEnum {
  VALID = 1,
  PENDING = 2,
  INVALID = 3,
}

/**
 * Interface for student search API response
 */
export interface SearchStudentResp {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
}

/**
 * Interface for student detail API response
 */
export interface StudentDetail {
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  dateOfBirth: Date;
  contact: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    provinceState: string;
    country: string;
    postalCode: string;
    phone: string;
  };
  pdVerified: boolean;
  validSin: boolean;
  pdStatus: string;
  hasRestriction: boolean;
}

/**
 * Enumeration for Document purpose these are
 * the dropdown options from the form student
 * uploader, for the dropdown down field
 * `Document purpose`.
 *
 */
export enum DocumentPurpose {
  Application = "application",
  Verification = "verification",
  Appeal = "appeal",
  Identity = "identity",
}

/**
 *  FormIO FileObject
 */
export interface FormIOFileObject {
  name: string;
  originalName: string;
  size: number;
  storage: string;
  type: string;
  url: string;
}

/**
 *  Student uploader interface
 */
export interface StudentFileUploaderForm {
  documentPurpose: DocumentPurpose;
  applicationNumber?: string;
  fileUpload: FormIOFileObject[];
}

/**
 *  Student uploader interface
 */
export interface StudentFileUploader {
  submittedForm: StudentFileUploaderForm;
  associatedFiles: string[];
}
