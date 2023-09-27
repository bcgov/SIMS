import {
  AddressDetailsFormAPIDTO,
  AESTStudentProfileAPIOutDTO,
  InstitutionStudentProfileAPIOutDTO,
  SINValidationsAPIOutDTO,
  StudentProfileAPIOutDTO,
} from "@/services/http/dto";
import { IdentityProviders } from "@/types";

export type StudentProfile =
  | (
      | StudentProfileAPIOutDTO
      | InstitutionStudentProfileAPIOutDTO
      | AESTStudentProfileAPIOutDTO
    ) & {
      birthDateFormatted: string;
    };

/**
 * Disability status of student.
 */
export enum DisabilityStatus {
  NotRequested = "Not requested",
  Requested = "Requested",
  /** Permanent Disability. */
  PD = "PD",
  /** Persistent and Prolonged Disability.*/
  PPD = "PPD",
  Declined = "Declined",
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

export interface SINValidations extends SINValidationsAPIOutDTO {
  sinFormatted?: string;
  createdAtFormatted?: string;
  isValidSINFormatted?: string;
  validSINCheckFormatted?: string;
  validBirthdateCheckFormatted?: string;
  validFirstNameCheckFormatted?: string;
  validLastNameCheckFormatted?: string;
  validGenderCheckFormatted?: string;
  sinExpiryDateFormatted?: string;
}

/**
 * Possible modes that the student profile form
 * can be adapted for different scenarios supported.
 */
export enum StudentProfileFormModes {
  /**
   * Student is editing his profile.
   */
  StudentEdit = "student-edit",
  /**
   * Student is creating his profile.
   */
  StudentCreate = "student-create",
  /**
   * Ministry is assessing a submitted basic BCeID
   * profile to confirm the student identity.
   */
  AESTAccountApproval = "aest-account-approval",
}

export type StudentProfileFormModel = Pick<
  StudentProfileAPIOutDTO,
  "firstName" | "lastName" | "gender" | "email" | "disabilityStatus"
> &
  AddressDetailsFormAPIDTO & {
    phone: string;
    dateOfBirth: string;
    mode: StudentProfileFormModes;
    identityProvider?: IdentityProviders;
    sinConsent: boolean;
  };
