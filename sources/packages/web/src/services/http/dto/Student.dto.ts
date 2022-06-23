import {
  FileOriginType,
  StudentPDStatus,
  RestrictionNotificationType,
} from "@/types";
import { ContactInformationAPIOutDTO } from "./Address.dto";
import { AddressDetailsFormAPIDTO } from "./Common.dto";

/**
 * Data saved while creating the student profile.
 * SIN validation not added to DTO because it is going
 * to be handled by the Form.IO dryRun validation.
 */
export interface CreateStudentAPIInDTO extends AddressDetailsFormAPIDTO {
  phone: string;
  sinNumber: string;
}

/**
 * Updates the student information that the student is allowed to change
 * in the solution. Other data must be edited externally (e.g. BCSC).
 */
export interface UpdateStudentAPIInDTO extends AddressDetailsFormAPIDTO {
  phone: string;
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
  pdStatus: StudentPDStatus;
}

export interface AESTStudentProfileAPIOutDTO extends StudentProfileAPIOutDTO {
  hasRestriction: boolean;
}

/**
 *  Student uploader interface
 */
export interface StudentFileUploaderInfoAPIInDTO {
  documentPurpose: string;
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
 *  AEST user to view student uploaded documents.
 */
export interface AESTStudentFileAPIOutDTO extends StudentUploadFileAPIOutDTO {
  metadata: StudentFileMetadataAPIOutDTO;
  groupName: string;
  updatedAt: Date;
}

export interface StudentFileMetadataAPIOutDTO {
  applicationNumber?: string;
}

/**
 * Interface for student search API response
 */
export interface SearchStudentAPIOutDTO {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
}

export interface ApplicationSummaryAPIOutDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  id: number;
  applicationName: string;
  submitted?: Date;
  status: string;
}

/**
 * Student restriction DTO.
 * This object is returned by controller.
 */
export interface StudentRestrictionAPIOutDTO {
  /**
   * code is the restriction code.
   */
  code: string;
  /**
   * type is the notification type.
   */
  type: RestrictionNotificationType;
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
  sinExpireDate?: string;
}
