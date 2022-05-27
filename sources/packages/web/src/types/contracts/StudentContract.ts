import {
  AddressDetailsFormAPIDTO,
  ContactInformationAPIOutDTO,
} from "@/services/http/dto";
import { RestrictionNotificationType } from "./RestrictionContracts";
import { StudentProfileAPIOutDTO } from "@/services/http/dto/Student.dto";

export interface StudentContact extends AddressDetailsFormAPIDTO {
  phone: string;
}

export interface CreateStudent extends StudentContact {
  sinNumber?: string;
}

export interface StudentFormInfo extends StudentProfileAPIOutDTO {
  birthDateFormatted: string;
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
 * code, is the restriction code.
 * type, is the notification type.
 */
export interface StudentRestrictionAPIOutDTO {
  code: string;
  type: RestrictionNotificationType;
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
}

export enum FileOriginType {
  Temporary = "Temporary",
  Application = "Application",
  Student = "Student",
  Ministry = "Ministry",
}
