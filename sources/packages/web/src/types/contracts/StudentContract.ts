import {
  AddressDetailsFormAPIDTO,
  ContactInformationAPIOutDTO,
} from "@/services/http/dto";
import { RestrictionNotificationType } from "./RestrictionContracts";

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
  contact: ContactInformationAPIOutDTO;
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
 * Student restriction DTO.
 * This object is returned by controller.
 * Here the key is the restrictionCode and value
 * is the respective notificationType.
 */
export class StudentRestrictionAPIOutDTO {
  [key: string]: RestrictionNotificationType;
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
  fullName: string;
  gender: string;
  email: string;
  dateOfBirth: Date;
  contact: ContactInformationAPIOutDTO;
  pdVerified: boolean;
  validSin: boolean;
  pdStatus: string;
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

export enum FileOriginType {
  Temporary = "Temporary",
  Application = "Application",
  Student = "Student",
  Ministry = "Ministry",
}
