import { AddressDetailsFormAPIDTO } from "@/services/http/dto";

export interface StudentContact extends AddressDetailsFormAPIDTO {
  phone: string;
}
export interface CreateStudent extends StudentContact {
  sinNumber?: string;
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
 *  Student uploader interface
 */
export interface StudentFileUploaderForm {
  documentPurpose: string;
  applicationNumber?: string;
}

/**
 *  Student uploader interface
 */
export interface StudentFileUploaderDTO {
  submittedForm: StudentFileUploaderForm;
  associatedFiles: string[];
}

/**
 *  Student uploaded documents (i.e, FileOriginType.Student documents).
 */
export interface StudentUploadFileDTO {
  fileName: string;
  uniqueFileName: string;
}

/**
 *  AEST user to view student uploaded documents.
 */
export interface AESTStudentFileDTO extends StudentUploadFileDTO {
  metadata: StudentFileMetadataDTO;
  groupName: string;
  updatedAt: Date;
}

export interface StudentFileMetadataDTO {
  applicationNumber?: string;
}
