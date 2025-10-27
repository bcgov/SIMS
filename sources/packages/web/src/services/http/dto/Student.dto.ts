import {
  FileOriginType,
  DisabilityStatus,
  SpecificIdentityProviders,
  ApplicationStatus,
  OfferingIntensity,
  ModifiedIndependentStatus,
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

export interface LegacyStudentProfileAPIOutDTO {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sin: string;
  /**
   * Indicates if the student on SIMS is associated
   * with multiple profiles on the legacy system.
   */
  hasMultipleProfiles: boolean;
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
  modifiedIndependentStatus: ModifiedIndependentStatus;
  sinConsent: boolean;
  /**
   * Temporary property to indicate if the user can access full-time.
   * Created as optional to avoid further changes for institution
   * and Ministry DTOs that share this base class.
   */
  hasFulltimeAccess?: boolean;
}

export interface InstitutionStudentProfileAPIOutDTO
  extends StudentProfileAPIOutDTO {
  sin: string;
}

export interface AESTStudentProfileAPIOutDTO
  extends InstitutionStudentProfileAPIOutDTO {
  hasRestriction: boolean;
  identityProvider: SpecificIdentityProviders;
  legacyProfile?: LegacyStudentProfileAPIOutDTO;
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

/**
 *  AEST student file upload details.
 */
export interface AESTStudentFileDetailsAPIOutDTO
  extends StudentFileDetailsAPIOutDTO {
  uploadedBy: string;
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

/**
 * DTO object application summary info.
 */
export interface ApplicationSummaryAPIOutDTO {
  applicationNumber: string;
  isArchived: boolean;
  studyStartPeriod: string;
  studyEndPeriod: string;
  id: number;
  status: ApplicationStatus;
  parentApplicationId: number;
  /**
   * Original application submission date.
   */
  submittedDate?: Date;
  /**
   * Indicates if the application is able to use the
   * change request feature. Other conditions may apply.
   */
  isChangeRequestAllowedForPY: boolean;
  /**
   * Application offering intensity.
   */
  offeringIntensity: OfferingIntensity;
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

export interface LegacyStudentMatchAPIOutDTO {
  individualId: number;
  firstName?: string;
  lastName: string;
  birthDate: string;
  sin: string;
}

export interface LegacyStudentMatchesAPIOutDTO {
  matches: LegacyStudentMatchAPIOutDTO[];
}

export interface LegacyStudentMatchesAPIInDTO {
  individualId: number;
  noteDescription: string;
}

export interface UpdateModifiedIndependentStatusAPIInDTO {
  modifiedIndependentStatus: ModifiedIndependentStatus;
  noteDescription: string;
}
