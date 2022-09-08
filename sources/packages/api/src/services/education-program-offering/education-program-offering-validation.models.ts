import {
  ArrayMinSize,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsNumberOptions,
  IsOptional,
  IsPositive,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import {
  EducationProgram,
  OfferingIntensity,
  OfferingStatus,
  OfferingTypes,
  OFFERING_NAME_MAX_LENGTH,
  OFFERING_WIL_TYPE_MAX_LENGTH,
  StudyBreaksAndWeeks,
} from "../../database/entities";
import {
  IsPeriodStartDate,
  IsPeriodEndDate,
  HasNoPeriodOverlap,
  PeriodsAreBetweenLimits,
  PeriodMinLength,
  PeriodMaxLength,
} from "../../utilities/class-validation";
import { Type } from "class-transformer";
import { ProgramAllowsOfferingIntensity } from "./custom-validators/program-allows-offering-intensity";
import { ProgramAllowsOfferingDelivery } from "./custom-validators/program-allows-offering-delivery";
import { ProgramAllowsOfferingWIL } from "./custom-validators/program-allows-offering-wil";
import { StudyBreaksCombinedMustNotExceedsThreshold } from "./custom-validators/study-break-has-valid-consecutive-threshold";
import { HasValidOfferingPeriodForFundedDays } from "./custom-validators/has-valid-offering-period-for-funded-days";
import {
  MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE,
  OFFERING_COURSE_LOAD_MAX_VALUE,
  OFFERING_COURSE_LOAD_MIN_VALUE,
  OFFERING_STUDY_BREAK_CONSECUTIVE_DAYS_THRESHOLD,
  OFFERING_STUDY_BREAK_MIN_DAYS,
  OFFERING_STUDY_PERIOD_MAX_DAYS,
  OFFERING_STUDY_PERIOD_MIN_DAYS,
  OFFERING_YEAR_OF_STUDY_MAX_VALUE,
  OFFERING_YEAR_OF_STUDY_MIN_VALUE,
} from "../../utilities";
import { InsertResult } from "typeorm";

/**
 * Number format expected for the offering currency values.
 */
export const currencyNumberOptions: IsNumberOptions = {
  allowNaN: false,
  allowInfinity: false,
  maxDecimalPlaces: 0,
};

/**
 * Subset of the education program required to perform the offering validations.
 */
export type EducationProgramForOfferingValidationContext = Pick<
  EducationProgram,
  | "id"
  | "programIntensity"
  | "hasWILComponent"
  | "deliveredOnSite"
  | "deliveredOnline"
>;

/**
 * Subset of the offering save model required to execute the study breaks calculations.
 */
export type OfferingStudyBreakCalculationContext = Pick<
  SaveOfferingModel,
  "studyEndDate" | "studyStartDate" | "studyBreaks"
>;

/**
 * Result of the study break calculation used for offering validations.
 */
export type CalculatedStudyBreaksAndWeeks = StudyBreaksAndWeeks & {
  sumOfTotalEligibleBreakDays: number;
  sumOfTotalIneligibleBreakDays: number;
  allowableStudyBreaksDaysAmount: number;
};

// export interface EducationProgramValidationContext {
//   programContext: EducationProgramForOfferingValidationContext;
// }

export enum OfferingValidationWarnings {
  InvalidStudyBreakConsecutiveThreshold = "invalidStudyBreakConsecutiveThreshold",
  ProgramOfferingIntensityMismatch = "programOfferingIntensityMismatch",
  ProgramOfferingDeliveryMismatch = "programOfferingDeliveryMismatch",
  ProgramOfferingWILMismatch = "programOfferingWILMismatch",
  InvalidStudyDatesPeriodLength = "invalidStudyDatesPeriodLength",
}

export class ValidationWarning {
  constructor(public readonly warningType: OfferingValidationWarnings) {
    this.isWarning = true;
  }
  readonly isWarning: boolean;
}

export enum OfferingDeliveryOptions {
  Onsite = "onsite",
  Online = "online",
  Blended = "blended",
}

export enum WILComponentOptions {
  Yes = "yes",
  No = "no",
}

export class StudyBreak {
  @IsDateString()
  @IsPeriodStartDate()
  breakStartDate: string;
  @IsDateString()
  @IsPeriodEndDate()
  @PeriodMinLength(
    (studyBreak: StudyBreak) => studyBreak.breakStartDate,
    OFFERING_STUDY_BREAK_MIN_DAYS,
  )
  @PeriodMaxLength(
    (studyBreak: StudyBreak) => studyBreak.breakStartDate,
    OFFERING_STUDY_BREAK_CONSECUTIVE_DAYS_THRESHOLD,
    {
      context: new ValidationWarning(
        OfferingValidationWarnings.InvalidStudyBreakConsecutiveThreshold,
      ),
    },
  )
  breakEndDate: string;
}

/**
 * Study start date property used as parameters in some validators.
 */
const studyStartDateProperty = (offering: SaveOfferingModel) =>
  offering.studyStartDate;
/**
 * Study end date property used as parameters in some validators.
 */
const studyEndDateProperty = (offering: SaveOfferingModel) =>
  offering.studyEndDate;

/**
 * Complete offering data with all validations needed to ensure data
 * consistency. Program data and locations data need to be present to
 * ensure a successfully validation.
 * Must be used for any offering created or updated.
 */
export class SaveOfferingModel {
  @IsNotEmpty()
  @MaxLength(OFFERING_NAME_MAX_LENGTH)
  offeringName: string;
  @IsDateString()
  studyStartDate: string;
  @IsDateString()
  @PeriodMinLength(studyStartDateProperty, OFFERING_STUDY_PERIOD_MIN_DAYS, {
    context: new ValidationWarning(
      OfferingValidationWarnings.InvalidStudyDatesPeriodLength,
    ),
  })
  @PeriodMaxLength(studyStartDateProperty, OFFERING_STUDY_PERIOD_MAX_DAYS, {
    context: new ValidationWarning(
      OfferingValidationWarnings.InvalidStudyDatesPeriodLength,
    ),
  })
  studyEndDate: string;
  @Min(0)
  @Max(MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE)
  @IsNumber(currencyNumberOptions)
  actualTuitionCosts: number;
  @Min(0)
  @Max(MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE)
  @IsNumber(currencyNumberOptions)
  programRelatedCosts: number;
  @Min(0)
  @Max(MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE)
  @IsNumber(currencyNumberOptions)
  mandatoryFees: number;
  @Min(0)
  @Max(MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE)
  @IsNumber(currencyNumberOptions)
  exceptionalExpenses: number;
  @IsEnum(OfferingDeliveryOptions)
  @ValidateIf((offering: SaveOfferingModel) => !!offering.programContext)
  @ProgramAllowsOfferingDelivery({
    context: new ValidationWarning(
      OfferingValidationWarnings.ProgramOfferingDeliveryMismatch,
    ),
  })
  offeringDelivered: string;
  @IsEnum(OfferingIntensity)
  @ValidateIf((offering: SaveOfferingModel) => !!offering.programContext)
  @ProgramAllowsOfferingIntensity({
    context: new ValidationWarning(
      OfferingValidationWarnings.ProgramOfferingIntensityMismatch,
    ),
  })
  offeringIntensity: OfferingIntensity;
  @Min(OFFERING_YEAR_OF_STUDY_MIN_VALUE)
  @Max(OFFERING_YEAR_OF_STUDY_MAX_VALUE)
  yearOfStudy: number;
  @IsBoolean()
  showYearOfStudy: boolean;
  @IsEnum(WILComponentOptions)
  @ValidateIf((offering: SaveOfferingModel) => !!offering.programContext)
  @ProgramAllowsOfferingWIL({
    context: new ValidationWarning(
      OfferingValidationWarnings.ProgramOfferingWILMismatch,
    ),
  })
  hasOfferingWILComponent: WILComponentOptions;
  @ValidateIf(
    (offering: SaveOfferingModel) =>
      offering.hasOfferingWILComponent === WILComponentOptions.Yes,
  )
  @IsNotEmpty()
  @MaxLength(OFFERING_WIL_TYPE_MAX_LENGTH)
  offeringWILComponentType?: string;
  @IsIn([true])
  offeringDeclaration: boolean;
  @IsIn([OfferingTypes.Private, OfferingTypes.Public])
  offeringType: OfferingTypes;
  @IsOptional()
  @Min(OFFERING_COURSE_LOAD_MIN_VALUE)
  @Max(OFFERING_COURSE_LOAD_MAX_VALUE)
  courseLoad?: number;
  @IsBoolean()
  lacksStudyBreaks: boolean;
  @Type(() => StudyBreak)
  @ValidateIf(
    (offering: SaveOfferingModel) =>
      !offering.lacksStudyBreaks &&
      !!offering.studyStartDate &&
      !!offering.studyEndDate,
  )
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @HasNoPeriodOverlap()
  @PeriodsAreBetweenLimits(studyStartDateProperty, studyEndDateProperty)
  @StudyBreaksCombinedMustNotExceedsThreshold(
    studyStartDateProperty,
    studyEndDateProperty,
  )
  @HasValidOfferingPeriodForFundedDays(
    studyStartDateProperty,
    studyEndDateProperty,
    {
      context: new ValidationWarning(
        OfferingValidationWarnings.InvalidStudyDatesPeriodLength,
      ),
    },
  )
  studyBreaks: StudyBreak[];
  @IsPositive({
    message: "Related institution location was not found or not provided.",
  })
  locationId: number;
  @IsNotEmptyObject(undefined, {
    message:
      "Not able to find a program related to this offering or it was not provided.",
  })
  programContext: EducationProgramForOfferingValidationContext;
}

/**
 * Validation warning with a unique type and
 * a user-friendly message to be displayed.
 */
export interface ValidationWarningResult {
  warningType: OfferingValidationWarnings;
  warningMessage: string;
}

/**
 * Results of the offering model validation with the
 * offering status when possible. If the offering contains
 * critical errors the status will not be defined.
 */
export interface OfferingValidationResult {
  /**
   * Record index in the list of records. Headers are not considered.
   */
  index: number;
  /**
   * validated offering model.
   */
  offeringModel: SaveOfferingModel;
  /**
   * Offering status defined from the validation results.
   * - Approved: no critical errors and no warnings.
   * - CreationPending: no critical errors and some warnings.
   * - Undefined: some critical error.
   */
  offeringStatus?: OfferingStatus.Approved | OfferingStatus.CreationPending;
  /**
   * Warnings, if any.
   */
  warnings: ValidationWarningResult[];
  /**
   * Users friendly errors list, if any.
   */
  errors: string[];
}

/**
 * Result of the successful attempt to insert the validated offering into
 * the database. Used in a parallel bulk insert to provide the
 * status of every successfully inserted record.
 */
export interface ValidatedOfferingInsertResult {
  validatedOffering: OfferingValidationResult;
  insertResult: InsertResult;
}

/**
 * Result of the fail attempt to insert the validated offering into
 * the database. Used in a parallel bulk insert to provide the
 * status of every failed inserted record.
 */
export class CreateFromValidatedOfferingError {
  constructor(
    public readonly validatedOffering: OfferingValidationResult,
    public readonly error: string,
  ) {}
}

/**
 * Detailed information of success or a failure to insert
 * the validated offering into the database.
 */
export interface CreateValidatedOfferingResult {
  validatedOffering: OfferingValidationResult;
  createdOfferingId?: number;
  success: boolean;
  error: string;
}
