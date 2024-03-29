import {
  IsDate,
  IsIn,
  IsNumberString,
  Length,
  ValidateIf,
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
   * Application Status.
   */
  @ValidateIf(
    (object: ApplicationBulkWithdrawalValidationModel) =>
      object.applicationFound,
  )
  @IsIn([ApplicationStatus.Completed], {
    message: `The application is not in the ${ApplicationStatus.Completed} status.`,
  })
  applicationStatus?: ApplicationStatus;
  /**
   * Application archived.
   */
  @ValidateIf(
    (object: ApplicationBulkWithdrawalValidationModel) =>
      object.applicationFound && !object.hasPreviouslyBeenWithdrawn,
  )
  @IsIn([false], {
    message: "Application is already archived and cannot be withdrawn.",
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
    message:
      "This application is already withdrawn and is going to be skipped.",
    context: ValidationContext.CreateWarning(
      ApplicationWithdrawalValidationWarnings.HasPreviouslyBeenWithdrawn,
    ),
  })
  hasPreviouslyBeenWithdrawn?: boolean;
}

/**
 * Application bulk withdrawal header and data models.
 */
export interface BulkWithdrawalFileData {
  header: ApplicationBulkWithdrawalHeader;
  records: ApplicationWithdrawalImportTextModel[];
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
  warnings: ValidationResult[];
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
