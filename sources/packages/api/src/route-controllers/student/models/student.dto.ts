import { StudentPDStatus, StudentContact } from "../../../types";

export class GetStudentContactDto {
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
}

/**
 * Common data saved while creating
 * or updating the student profile.
 * Validations not added to DTO because
 * they are going to be handled by the
 * Form.IO dryRun validation.
 */
export interface SaveStudentDto {
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
  /**
   * SIN is optional during update.
   */
  sinNumber?: string;
}

export interface FileCreateDto {
  fileName: string;
  uniqueFileName: string;
  url: string;
  size: number;
  mimetype: string;
}

export interface StudentEducationProgramDto {
  id: number;
  name: string;
  description: string;
  credentialType: string;
  credentialTypeToDisplay: string;
  deliveryMethod: string;
}

export interface SearchStudentRespDto {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
}

/**
 * DTO Object for student restriction.
 * This object is returned by controller.
 */
export interface StudentRestrictionDTO {
  hasRestriction: boolean;
  hasFederalRestriction: boolean;
  hasProvincialRestriction: boolean;
  restrictionMessage: string;
}
/**
 * DTO object for student details.
 */
export interface StudentDetailDTO {
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  dateOfBirth: Date;
  contact: StudentContact;
  pdVerified: boolean;
  pdStatus: StudentPDStatus;
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
