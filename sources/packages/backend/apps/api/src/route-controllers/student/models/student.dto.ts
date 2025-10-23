import { Type } from "class-transformer";
import {
  Allow,
  ArrayMinSize,
  IsBoolean,
  IsDateString,
  IsDefined,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  Length,
  MaxLength,
  ValidateIf,
} from "class-validator";
import { IsValidSIN } from "../../../utilities/class-validation/custom-validators/sin-validator";
import {
  ApplicationStatus,
  FileOriginType,
  NOTE_DESCRIPTION_MAX_LENGTH,
  FILE_NAME_MAX_LENGTH,
  DisabilityStatus,
  USER_LAST_NAME_MAX_LENGTH,
  USER_GIVEN_NAMES_MAX_LENGTH,
  SpecificIdentityProviders,
  OfferingIntensity,
  ModifiedIndependentStatus,
} from "@sims/sims-db";
import {
  AddressAPIOutDTO,
  AddressDetailsAPIInDTO,
} from "../../../route-controllers/models/common.dto";

export class ContactInformationAPIOutDTO {
  address: AddressAPIOutDTO;
  phone: string;
}

/**
 * Student profile fields used in the form.io logic (to display hide UI elements)
 * that must also be present on the payload to the proper result of the dry run.
 */
interface StudentProfileFormLogicalFields {
  /**
   * Used to allow the UI to display or not the SIN during
   * student profile creation. If not present it will be removed
   * by Nestjs and the Form.io dry run will also remove it from its
   * output considering that the form is not in creation mode.
   */
  mode: string;
  /**
   * Used to adapt the student profile to be used to BCeID and BCSC.
   * If not present it will be removed by Nestjs and the Form.io
   * will produce a different dry run output.
   */
  identityProvider: string;
}

/**
 * Data saved while creating the student profile.
 * SIN validation not added to DTO because it is going
 * to be handled by the Form.IO dryRun validation.
 */
export class CreateStudentAPIInDTO
  extends AddressDetailsAPIInDTO
  implements StudentProfileFormLogicalFields
{
  @Length(10, 20)
  phone: string;
  @Allow()
  sinNumber: string;
  @Allow()
  mode: string;
  @Allow()
  identityProvider: string;
  @Allow()
  sinConsent: boolean;
  @Allow()
  gender: string;
}

/**
 * Updates the student information that the student is allowed to change
 * in the solution. Other data must be edited externally (e.g. BCSC).
 */
export class UpdateStudentAPIInDTO
  extends AddressDetailsAPIInDTO
  implements StudentProfileFormLogicalFields
{
  @Length(10, 20)
  phone: string;
  @Allow()
  mode: string;
  @Allow()
  identityProvider: string;
  @Allow()
  gender: string;
}

/**
 * Student search parameters.
 */
export class StudentSearchAPIInDTO {
  @ValidateIf(
    (input: StudentSearchAPIInDTO) =>
      !input.lastName && !input.appNumber && !input.sin,
  )
  @IsNotEmpty()
  firstName: string;
  @ValidateIf(
    (input: StudentSearchAPIInDTO) =>
      !input.firstName && !input.appNumber && !input.sin,
  )
  @IsNotEmpty()
  lastName: string;
  @ValidateIf(
    (input: StudentSearchAPIInDTO) =>
      !input.firstName && !input.lastName && !input.sin,
  )
  @IsNotEmpty()
  appNumber: string;
  @ValidateIf(
    (input: StudentSearchAPIInDTO) =>
      !input.firstName && !input.lastName && !input.appNumber,
  )
  @IsNotEmpty()
  sin: string;
}

export class SearchStudentAPIOutDTO {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  sin: string;
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
 *  AEST / Institution user to view student uploaded documents.
 */
export class StudentFileDetailsAPIOutDTO extends StudentUploadFileAPIOutDTO {
  metadata: StudentFileMetadataAPIOutDTO;
  groupName: string;
  createdAt: Date;
}

/**
 *  AEST student file upload details.
 */
export class AESTStudentFileDetailsAPIOutDTO extends StudentFileDetailsAPIOutDTO {
  uploadedBy: string;
}

export class StudentFileMetadataAPIOutDTO {
  applicationNumber?: string;
}

export class LegacyStudentProfileAPIOutDTO {
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

export class StudentProfileAPIOutDTO {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  contact: ContactInformationAPIOutDTO;
  validSin: boolean;
  disabilityStatus: DisabilityStatus;
  modifiedIndependentStatus?: ModifiedIndependentStatus;
  /**
   * Temporary property to indicate if the user can access full-time.
   * Created as optional to avoid further changes for institution
   * and Ministry DTOs that share this base class.
   */
  hasFulltimeAccess?: boolean;
}

export class InstitutionStudentProfileAPIOutDTO extends StudentProfileAPIOutDTO {
  sin: string;
}

export class AESTStudentProfileAPIOutDTO extends InstitutionStudentProfileAPIOutDTO {
  hasRestriction: boolean;
  identityProviderType: SpecificIdentityProviders;
  legacyProfile?: LegacyStudentProfileAPIOutDTO;
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

export class UniqueFileNameParamAPIInDTO {
  @IsNotEmpty()
  @MaxLength(FILE_NAME_MAX_LENGTH)
  uniqueFileName: string;
}

export enum ModifiedIndependentUpdateStatus {
  Approved = "Approved",
  Declined = "Declined",
  NotRequested = "Not requested",
}

export class UpdateModifiedIndependentStatusAPIInDTO {
  @IsEnum(ModifiedIndependentUpdateStatus)
  modifiedIndependentUpdateStatus: ModifiedIndependentUpdateStatus;
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  noteDescription: string;
}

/**
 * Details to update disability status with notes.
 */
export class UpdateDisabilityStatusAPIInDTO {
  @IsEnum(DisabilityStatus)
  disabilityStatus: DisabilityStatus;
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  noteDescription: string;
}

/**
 * Updates the student information.
 */
export class UpdateStudentDetailsAPIInDTO {
  @IsNotEmpty()
  @MaxLength(USER_LAST_NAME_MAX_LENGTH)
  lastName: string;
  @MaxLength(USER_GIVEN_NAMES_MAX_LENGTH)
  @ValidateIf(
    (value: UpdateStudentDetailsAPIInDTO) => value.givenNames !== null,
  )
  givenNames: string;
  @IsNotEmpty()
  @IsDateString()
  birthdate: string;
  @IsNotEmpty()
  @IsEmail()
  email: string;
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  noteDescription: string;
}

export class LegacyStudentMatchAPIOutDTO {
  individualId: number;
  firstName?: string;
  lastName: string;
  birthDate: string;
  sin: string;
}

export class LegacyStudentMatchesAPIOutDTO {
  matches: LegacyStudentMatchAPIOutDTO[];
}

export class LegacyStudentMatchesAPIInDTO {
  @IsPositive()
  individualId: number;
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  noteDescription: string;
}
