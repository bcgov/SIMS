import { Type } from "class-transformer";
import {
  Allow,
  ArrayMinSize,
  IsBoolean,
  IsDateString,
  IsDefined,
  IsNotEmpty,
  IsOptional,
  Length,
  MaxLength,
  ValidateIf,
} from "class-validator";
import { IsValidSIN } from "src/route-controllers/utils/custom-validators/sin-validator";
import {
  ApplicationStatus,
  FileOriginType,
  NOTE_DESCRIPTION_MAX_LENGTH,
} from "../../../database/entities";
import { RestrictionNotificationType } from "../../../database/entities/restriction-notification-type.type";
import {
  AddressAPIOutDTO,
  AddressDetailsAPIInDTO,
} from "../../../route-controllers/models/common.dto";
import { StudentPDStatus } from "../../../types";

export class ContactInformationAPIOutDTO {
  address: AddressAPIOutDTO;
  phone: string;
}

/**
 * Data saved while creating the student profile.
 * SIN validation not added to DTO because it is going
 * to be handled by the Form.IO dryRun validation.
 */
export class CreateStudentAPIInDTO extends AddressDetailsAPIInDTO {
  @Length(10, 20)
  phone: string;
  @Allow()
  sinNumber: string;
  /**
   * This is used to allow the UI to display or not the SIN during
   * student profile creation. If not present here it will be removed
   * by Nestjs and the Form.io dry run will also remove it from it
   * output considering that the form is not in creation mode.
   */
  @Allow()
  mode: string;
}

/**
 * Updates the student information that the student is allowed to change
 * in the solution. Other data must be edited externally (e.g. BCSC).
 */
export class UpdateStudentAPIInDTO extends AddressDetailsAPIInDTO {
  @Length(10, 20)
  phone: string;
}

/**
 * Student AEST search parameters.
 */
export class AESTStudentSearchAPIInDTO {
  @ValidateIf((input) => !input.lastName && !input.appNumber)
  @IsNotEmpty()
  firstName: string;
  @ValidateIf((input) => !input.firstName && !input.appNumber)
  @IsNotEmpty()
  lastName: string;
  @ValidateIf((input) => !input.firstName && !input.lastName)
  @IsNotEmpty()
  appNumber: string;
}

export class SearchStudentAPIOutDTO {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
}

/**
 * DTO for student restriction.
 * This object is returned by controller.
 */
export class StudentRestrictionAPIOutDTO {
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
 *  Student uploader interface
 */
export class StudentFileUploaderInfoAPIInDTO {
  @IsNotEmpty()
  documentPurpose: string;
  @IsOptional()
  applicationNumber?: string;
}

/**
 *  Student uploader interface
 */
export class StudentFileUploaderAPIInDTO {
  @IsDefined()
  @Type(() => StudentFileUploaderInfoAPIInDTO)
  submittedForm: StudentFileUploaderInfoAPIInDTO;
  @ArrayMinSize(1)
  associatedFiles: string[];
}

/**
 *  Student uploaded documents (i.e, FileOriginType.Student documents).
 */
export class StudentUploadFileAPIOutDTO {
  fileName: string;
  uniqueFileName: string;
  fileOrigin: FileOriginType;
}

/**
 *  AEST user to view student uploaded documents.
 */
export class AESTStudentFileAPIOutDTO extends StudentUploadFileAPIOutDTO {
  metadata: StudentFileMetadataAPIOutDTO;
  groupName: string;
  updatedAt: Date;
}

export class StudentFileMetadataAPIOutDTO {
  applicationNumber?: string;
}

export class StudentProfileAPIOutDTO {
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

export class AESTStudentProfileAPIOutDTO extends StudentProfileAPIOutDTO {
  hasRestriction: boolean;
}

export class AESTFileUploadToStudentAPIInDTO {
  @ArrayMinSize(1)
  associatedFiles: string[];
}

/**
 * DTO object application summary info.
 */
export class ApplicationSummaryAPIOutDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  id: number;
  applicationName: string;
  submitted?: Date;
  status: ApplicationStatus;
}

/**
 * History of SIN validations associated with a user.
 */
export class SINValidationsAPIOutDTO {
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
export class CreateSINValidationAPIInDTO {
  @IsValidSIN()
  sin: string;
  @IsBoolean()
  skipValidations: boolean;
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  noteDescription: string;
}

/**
 * Updates a SIN validation record expiry date.
 */
export class UpdateSINValidationAPIInDTO {
  /**
   * Expire date is a date-only value.
   ** Please ensure that the time is not sent to the API.
   */
  @IsDateString()
  expiryDate: string;
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  noteDescription: string;
}
