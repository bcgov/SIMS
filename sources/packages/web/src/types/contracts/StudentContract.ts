import { StudentProfileAPIOutDTO } from "@/services/http/dto/Student.dto";

export interface StudentFormInfo extends StudentProfileAPIOutDTO {
  birthDateFormatted: string;
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

export enum FileOriginType {
  Temporary = "Temporary",
  Application = "Application",
  Student = "Student",
  Ministry = "Ministry",
}
