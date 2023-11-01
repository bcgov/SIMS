import {
  Equals,
  IsBoolean,
  IsDate,
  IsEnum,
  IsIn,
  IsNumberString,
  Length,
  ValidateIf,
} from "class-validator";
import {
  APPLICATION_NUMBER_LENGTH,
  ApplicationStatus,
  SIN_NUMBER_LENGTH,
} from "@sims/sims-db";
import {
  ApplicationBulkWithdrawalHeader,
  ApplicationWithdrawalImportTextModel,
  DataTextHeaders,
  RecordType,
} from "./application-bulk-withdrawal-import-text.models";

const userFriendlyNames = {
  application: "Application",
  applicationFound: "Application found",
  applicationBelongsToInstitution: "Application belongs to institution",
  validSIN: "Valid SIN",
  hasCorrectInstitutionCode: "Has correct institution code",
  hasPreviouslyBeenWithdrawn: "Has previously been withdrawn",
  applicationStatus: "Application status",
  isCompleted: "be completed",
  isArchived: "Is archived",
  archived: "archived",
  recordMatch: "Record match",
  record: "The record was not found",
};

/**
 * Possible warnings unique identifiers.
 * !These keys are also consumed in the UI to display/hide warning banners.
 */
export enum ApplicationWithdrawalValidationWarnings {
  ApplicationNotFound = "applicationNotFound",
  NoMatchingRecordFound = "noMatchingRecordFound",
  HasPreviouslyBeenWithdrawn = "hasPreviouslyBeenWithdrawn",
}

/**
 * Types of non-critical errors that will not prevent
 * the offering from being saved.
 */
export enum ValidationContextTypes {
  Warning = "warning",
}

/**
 * Represent the context of an error that has an additional context to
 * express a possible warning or some relevant information captured during
 * the validation process.
 * All validations when failed will generate an error. The ones that have
 * the warning or information contexts will not be considered critical.
 */
export class ValidationContext {
  /**
   * Creates an error context that will make the error downgrade to
   * a condition of a warning information will force the offering
   * to be reviewed by the Ministry.
   * @param warningTypeCode warning code that uniquely identifies this condition.
   * @returns the warning context.
   */
  static CreateWarning(
    warningTypeCode: ApplicationWithdrawalValidationWarnings,
  ): ValidationContext {
    const newContext = new ValidationContext();
    newContext.type = ValidationContextTypes.Warning;
    newContext.typeCode = warningTypeCode;
    return newContext;
  }

  /**
   * Context type.
   */
  type: ValidationContextTypes;
  /**
   * Unique identifier of the validation error.
   */
  typeCode: ApplicationWithdrawalValidationWarnings;
}

export class ApplicationBulkWithdrawalImportBusinessValidationModel {
  /**
   * Data record type.
   */
  @ValidateIf(
    (object: ApplicationBulkWithdrawalImportBusinessValidationModel) =>
      object.applicationFound,
  )
  @Equals(RecordType.ApplicationBulkWithdrawalDataRecordType, {
    message: `${DataTextHeaders.recordType} must be valid.`,
  })
  recordType: RecordType;
  /**
   * SIN.
   */
  @ValidateIf(
    (object: ApplicationBulkWithdrawalImportBusinessValidationModel) =>
      object.applicationFound,
  )
  @IsNumberString(
    { no_symbols: true },
    {
      message: `${DataTextHeaders.sin} must be a valid number.`,
    },
  )
  @Length(SIN_NUMBER_LENGTH, SIN_NUMBER_LENGTH, {
    message: `${DataTextHeaders.sin} must be of length ${SIN_NUMBER_LENGTH}.`,
  })
  sin: string;
  /**
   * Application Number.
   */
  @ValidateIf(
    (object: ApplicationBulkWithdrawalImportBusinessValidationModel) =>
      object.applicationFound,
  )
  @IsNumberString(
    { no_symbols: true },
    {
      message: `${DataTextHeaders.applicationNumber} must be a valid number.`,
    },
  )
  @Length(APPLICATION_NUMBER_LENGTH, APPLICATION_NUMBER_LENGTH, {
    message: `${DataTextHeaders.applicationNumber} must be of length ${APPLICATION_NUMBER_LENGTH}.`,
  })
  applicationNumber: string;
  /**
   * Withdrawal Date.
   */
  @ValidateIf(
    (object: ApplicationBulkWithdrawalImportBusinessValidationModel) =>
      object.applicationFound,
  )
  @IsDate({
    message: `${DataTextHeaders.withdrawalDate} must be a valid withdrawal date.`,
  })
  withdrawalDate: Date;
  /**
   * Application found.
   */
  @IsBoolean({
    message: `${userFriendlyNames.applicationFound} must be a boolean value.`,
  })
  @IsIn([true], {
    message: `${userFriendlyNames.application} is not present in SIMS and is a part of the SFAS system.`,
    context: ValidationContext.CreateWarning(
      ApplicationWithdrawalValidationWarnings.ApplicationNotFound,
    ),
  })
  applicationFound: boolean;
  /**
   * Application belongs to institution.
   */
  @ValidateIf(
    (object: ApplicationBulkWithdrawalImportBusinessValidationModel) =>
      object.applicationFound,
  )
  @IsBoolean({
    message: `${userFriendlyNames.applicationBelongsToInstitution}  must be a boolean value.`,
  })
  @IsIn([true], {
    message: `${userFriendlyNames.application} does not belong to this institution.`,
  })
  applicationBelongsToInstitution: boolean;
  /**
   * Valid SIN.
   */
  @ValidateIf(
    (object: ApplicationBulkWithdrawalImportBusinessValidationModel) =>
      object.applicationFound,
  )
  @IsBoolean({
    message: `${userFriendlyNames.validSIN} must be a boolean value.`,
  })
  validSIN: boolean;
  /**
   * Has correct institution code.
   */
  @ValidateIf(
    (object: ApplicationBulkWithdrawalImportBusinessValidationModel) =>
      object.applicationFound,
  )
  @IsBoolean({
    message: `${userFriendlyNames.hasCorrectInstitutionCode} must be a boolean value.`,
  })
  hasCorrectInstitutionCode: boolean;
  /**
   * Application Status.
   */
  @ValidateIf(
    (object: ApplicationBulkWithdrawalImportBusinessValidationModel) =>
      object.applicationFound,
  )
  @IsEnum(ApplicationStatus)
  @IsIn([ApplicationStatus.Completed], {
    message: `${userFriendlyNames.application} is not in the ${ApplicationStatus.Completed} status.`,
  })
  applicationStatus: ApplicationStatus;
  /**
   * Application archived.
   */
  @ValidateIf(
    (object: ApplicationBulkWithdrawalImportBusinessValidationModel) =>
      object.applicationFound,
  )
  @IsBoolean({
    message: `${userFriendlyNames.isArchived} must be a boolean value.`,
  })
  @IsIn([false], {
    message: `Application is already ${userFriendlyNames.archived} and cannot be withdrawn.`,
  })
  isArchived: boolean;
  /**
   * Has previously been withdrawn.
   */
  @ValidateIf(
    (object: ApplicationBulkWithdrawalImportBusinessValidationModel) =>
      object.applicationFound,
  )
  @IsBoolean({
    message: `The ${userFriendlyNames.hasPreviouslyBeenWithdrawn} must be a boolean value.`,
  })
  @IsIn([false], {
    message: `The ${userFriendlyNames.application} is already withdrawn.`,
    context: ValidationContext.CreateWarning(
      ApplicationWithdrawalValidationWarnings.HasPreviouslyBeenWithdrawn,
    ),
  })
  hasPreviouslyBeenWithdrawn: boolean;
  /**
   * Is record match .ie. SIN, application number and institution must match a record in database.
   */
  @ValidateIf(
    (object: ApplicationBulkWithdrawalImportBusinessValidationModel) =>
      object.applicationFound,
  )
  @IsBoolean({
    message: `${userFriendlyNames.recordMatch} must be a boolean value.`,
  })
  @IsIn([true], {
    message: `${userFriendlyNames.record} and will be skipped.`,
    context: ValidationContext.CreateWarning(
      ApplicationWithdrawalValidationWarnings.NoMatchingRecordFound,
    ),
  })
  isRecordMatch: boolean;
}

/**
 * Application bulk withdrawal header and data models.
 */
export interface FileData {
  header: ApplicationBulkWithdrawalHeader;
  applicationWithdrawalModels: ApplicationWithdrawalImportTextModel[];
}

/**
 * Validation warning with a unique type and
 * a user-friendly message to be displayed.
 */
export interface ValidationResult {
  typeCode: ApplicationWithdrawalValidationWarnings;
  message: string;
}

/**
 * Results of the application bulk withdrawal model validation.
 */
export interface ApplicationWithdrawalValidationResult {
  /**
   * Record index in the list of records. Headers are not considered.
   */
  index: number;
  /**
   * validated application bulk withdrawal model.
   */
  applicationBulkWithdrawalBusinessValidationModel: ApplicationBulkWithdrawalImportBusinessValidationModel;
  /**
   * Warnings, if any.
   */
  warnings: ValidationResult[];
  /**
   * Users friendly errors list, if any.
   */
  errors: string[];
}

export interface ApplicationData {
  sin: string;
  locationId: number;
  locationCode: string;
  applicationStatus: ApplicationStatus;
  isArchived: boolean;
  hasPreviouslyBeenWithdrawn: boolean;
}
