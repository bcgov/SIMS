import {
  FileOriginType,
  DisabilityStatus,
  SpecificIdentityProviders,
  ApplicationStatus,
} from "@/types";
import { ContactInformationAPIOutDTO } from "./Address.dto";
import { AddressDetailsFormAPIDTO } from "./Common.dto";
import { Expose } from "class-transformer";

/**
 * Data saved while creating the student profile.
 * SIN validation not added to DTO because it is going
 * to be handled by the Form.IO dryRun validation.
 */
export class CreateStudentAPIInDTO extends AddressDetailsFormAPIDTO {
  @Expose()
  phone: string;
  @Expose()
  sinNumber: string;
  @Expose()
  gender: string;
  @Expose()
  sinConsent: boolean;
}

/**
 * Updates the student information that the student is allowed to change
 * in the solution. Other data must be edited externally (e.g. BCSC).
 */
export class UpdateStudentAPIInDTO extends AddressDetailsFormAPIDTO {
  @Expose()
  phone: string;
  @Expose()
  gender: string;
  @Expose()
  mode: string;
  @Expose()
  identityProvider: string;
}

export interface UpdateStudentDetailsAPIInDTO {
  givenNames?: string;
  lastName: string;
  birthdate: string;
  email: string;
  noteDescription: string;
}

export interface StudentProfileAPIOutDTO {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  contact: ContactInformationAPIOutDTO;
  validSin: boolean;
  disabilityStatus: DisabilityStatus;
  sinConsent: boolean;
}

export interface InstitutionStudentProfileAPIOutDTO
  extends StudentProfileAPIOutDTO {
  sin: string;
}

export interface AESTStudentProfileAPIOutDTO
  extends InstitutionStudentProfileAPIOutDTO {
  hasRestriction: boolean;
  identityProvider: SpecificIdentityProviders;
}

/**
 *  Student uploader interface
 */
export class StudentFileUploaderInfoAPIInDTO {
  @Expose()
  documentPurpose: string;
  @Expose()
  applicationNumber?: string;
}

/**
 *  Student uploader interface
 */
export interface StudentFileUploaderAPIInDTO {
  submittedForm: StudentFileUploaderInfoAPIInDTO;
  associatedFiles: string[];
}

export interface AESTFileUploadToStudentAPIInDTO {
  associatedFiles: string[];
}

/**
 *  Student uploaded documents (i.e, FileOriginType.Student documents).
 */
export interface StudentUploadFileAPIOutDTO {
  fileName: string;
  uniqueFileName: string;
  fileOrigin: FileOriginType;
}

/**
 *  AEST / Institution user to view student uploaded documents.
 */
export interface StudentFileDetailsAPIOutDTO
  extends StudentUploadFileAPIOutDTO {
  metadata: StudentFileMetadataAPIOutDTO;
  groupName: string;
  createdAt: Date;
}

export interface StudentFileMetadataAPIOutDTO {
  applicationNumber?: string;
}

/**
 * Interface for student search API request
 */
export interface SearchStudentAPIInDTO {
  firstName?: string;
  lastName?: string;
  appNumber?: string;
  sin?: string;
}

/**
 * Interface for student search API response
 */
export interface SearchStudentAPIOutDTO {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  sin: string;
}

export interface ApplicationSummaryAPIOutDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  id: number;
  applicationName: string;
  submitted?: Date;
  status: ApplicationStatus;
  parentApplicationId: number;
  submittedDate?: Date;
}

/**
 * History of SIN validations associated with a user.
 */
export interface SINValidationsAPIOutDTO {
  id: number;
  sin: string;
  createdAt: Date;
  isValidSIN?: boolean;
  sinStatus?: string;
  validSINCheck?: string;
  validBirthdateCheck?: string;
  validFirstNameCheck?: string;
  validLastNameCheck?: string;
  validGenderCheck?: string;
  temporarySIN: boolean;
  sinExpiryDate?: string;
}

/**
 * DTO to allow manually creation of SIN validations.
 */
export interface CreateSINValidationAPIInDTO {
  sin: string;
  skipValidations: boolean;
  noteDescription: string;
}

/**
 * Updates a SIN validation record expiry date.
 */
export interface UpdateSINValidationAPIInDTO {
  expiryDate: string;
  noteDescription: string;
}

/**
 * Details to update disability status with notes.
 */
export interface UpdateDisabilityStatusAPIInDTO {
  disabilityStatus: DisabilityStatus;
  noteDescription: string;
}
