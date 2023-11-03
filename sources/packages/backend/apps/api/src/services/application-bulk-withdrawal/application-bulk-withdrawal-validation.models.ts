import {
  IsDate,
  IsEnum,
  IsIn,
  IsNumberString,
  Length,
  ValidateIf,
  ValidationArguments,
} from "class-validator";
import { APPLICATION_NUMBER_LENGTH, ApplicationStatus } from "@sims/sims-db";
import {
  ApplicationBulkWithdrawalHeader,
  ApplicationWithdrawalImportTextModel,
  DataTextHeaders,
} from "./application-bulk-withdrawal-import-text.models";
import {
  IsValidSIN,
  ValidationContext,
  ValidationResult,
} from "../../utilities/class-validation";

/**
 * Possible warnings unique identifiers.
 */
export enum ApplicationWithdrawalValidationWarnings {
  ApplicationNotFound = "applicationNotFound",
  NoMatchingRecordFound = "noMatchingRecordFound",
  HasPreviouslyBeenWithdrawn = "hasPreviouslyBeenWithdrawn",
}

export class ApplicationBulkWithdrawalValidationModel {
  /**
   * SIN.
   */
  @IsValidSIN({
    message: `${DataTextHeaders.sin} must be a valid SIN.`,
  })
  sin: string;
  /**
   * Application Number.
   */
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
  @IsDate({
    message: `${DataTextHeaders.withdrawalDate} must be a valid withdrawal date.`,
  })
  withdrawalDate: Date;
  /**
   * Application found.
   */
  @IsIn([true], {
    message:
      "Application number not found. The withdrawal request for this application will not be processed.",
    context: ValidationContext.CreateWarning(
      ApplicationWithdrawalValidationWarnings.ApplicationNotFound,
    ),
  })
  applicationFound: boolean;
  /**
   * Valid SIN.
   */
  @ValidateIf(
    (object: ApplicationBulkWithdrawalValidationModel) =>
      object.applicationFound,
  )
  studentSINMatch?: boolean;
  /**
   * Has correct institution code.
   */
  @ValidateIf(
    (object: ApplicationBulkWithdrawalValidationModel) =>
      object.applicationFound,
  )
  @IsIn([true], {
    message: "The institution code provided is incorrect.",
  })
  hasCorrectInstitutionCode?: boolean;
  /**
   * Application Status.
   */
  @ValidateIf(
    (object: ApplicationBulkWithdrawalValidationModel) =>
      object.applicationFound,
  )
  @IsEnum(ApplicationStatus)
  @IsIn([ApplicationStatus.Completed], {
    message: `The application is not in the ${ApplicationStatus.Completed} status.`,
  })
  applicationStatus?: ApplicationStatus;
  /**
   * Application archived.
   */
  @ValidateIf(
    (object: ApplicationBulkWithdrawalValidationModel) =>
      object.applicationFound,
  )
  @IsIn([false], {
    message: `Application is already archived and cannot be withdrawn.`,
  })
  isArchived?: boolean;
  /**
   * Has previously been withdrawn.
   */
  @ValidateIf(
    (object: ApplicationBulkWithdrawalValidationModel) =>
      object.applicationFound,
  )
  @IsIn([false], {
    message: (validationArguments: ValidationArguments) =>
      `The application is already withdrawn with the date: ${validationArguments.object["withdrawalDate"]}.`,
    context: ValidationContext.CreateWarning(
      ApplicationWithdrawalValidationWarnings.HasPreviouslyBeenWithdrawn,
    ),
  })
  hasPreviouslyBeenWithdrawn?: boolean;
  /**
   * Is record match .ie. SIN, application number and institution must match a record in database.
   */
  @ValidateIf(
    (object: ApplicationBulkWithdrawalValidationModel) =>
      object.applicationFound,
  )
  @IsIn([true], {
    message: "The record was not found and will be skipped.",
    context: ValidationContext.CreateWarning(
      ApplicationWithdrawalValidationWarnings.NoMatchingRecordFound,
    ),
  })
  isRecordMatch?: boolean;
}

/**
 * Application bulk withdrawal header and data models.
 */
export interface BulkWithdrawalFileData {
  header: ApplicationBulkWithdrawalHeader;
  applicationWithdrawalModels: ApplicationWithdrawalImportTextModel[];
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
   * Validated application bulk withdrawal model.
   */
  validationModel: ApplicationBulkWithdrawalValidationModel;
  /**
   * Warnings, if any.
   */
  warnings: ValidationResult<ApplicationWithdrawalValidationWarnings>[];
  /**
   * Users friendly errors list, if any.
   */
  errors: string[];
}

/**
 * Application data for the application bulk withdrawal.
 */
export interface ApplicationData {
  sin: string;
  locationId: number;
  locationCode: string;
  applicationStatus: ApplicationStatus;
  isArchived: boolean;
  hasPreviouslyBeenWithdrawn: boolean;
}
