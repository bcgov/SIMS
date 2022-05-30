import { StudentProfileAPIOutDTO } from "@/services/http/dto";
import { RestrictionNotificationType } from "@/types";

export interface StudentFormInfo extends StudentProfileAPIOutDTO {
  birthDateFormatted: string;
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

/**
 * Contract for student restriction.
 */
export interface StudentRestriction {
  /**
   * code is the restriction code.
   */
  code: string;
  /**
   * type is the notification type.
   */
  type: RestrictionNotificationType;
}
