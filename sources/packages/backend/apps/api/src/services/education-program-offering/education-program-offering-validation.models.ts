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
} from "@sims/sims-db";
import {
  IsPeriodStartDate,
  IsPeriodEndDate,
  HasNoPeriodOverlap,
  PeriodsAreBetweenLimits,
  PeriodMinLength,
  PeriodMaxLength,
  IsDateAfter,
} from "../../utilities/class-validation";
import { Type } from "class-transformer";
import { ProgramAllowsOfferingIntensity } from "./custom-validators/program-allows-offering-intensity";
import { ProgramAllowsOfferingDelivery } from "./custom-validators/program-allows-offering-delivery";
import { ProgramAllowsOfferingWIL } from "./custom-validators/program-allows-offering-wil";
import { StudyBreaksCombinedMustNotExceedsThreshold } from "./custom-validators/study-break-has-valid-consecutive-threshold";
import { HasValidOfferingPeriodForFundedDays } from "./custom-validators/has-valid-offering-period-for-funded-days";
import {
  DATE_ONLY_ISO_FORMAT,
  MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE,
  OFFERING_COURSE_LOAD_MAX_VALUE,
  OFFERING_COURSE_LOAD_MIN_VALUE,
  OFFERING_STUDY_BREAK_MAX_DAYS,
  OFFERING_STUDY_BREAK_MIN_DAYS,
  OFFERING_STUDY_PERIOD_MAX_DAYS,
  OFFERING_STUDY_PERIOD_MIN_DAYS,
  OFFERING_YEAR_OF_STUDY_MAX_VALUE,
  OFFERING_YEAR_OF_STUDY_MIN_VALUE,
} from "../../utilities";

const userFriendlyNames = {
  offeringName: "Name",
  studyStartDate: "Start date",
  studyEndDate: "End date",
  actualTuitionCosts: "Tuition",
  programRelatedCosts: "Program related costs",
  mandatoryFees: "Mandatory fees",
  exceptionalExpenses: "Exceptional expenses",
  offeringDelivered: "Delivery type",
  offeringIntensity: "Offering intensity",
  yearOfStudy: "Year of study",
  showYearOfStudy: "Show year of study",
  hasOfferingWILComponent: "WIL Component",
  offeringWILComponentType: "WIL Component Type",
  offeringDeclaration: "Consent",
  offeringType: "Offering type",
  courseLoad: "Course load",
  lacksStudyBreaks: "Lacks study breaks",
  studyBreaks: "Study breaks",
  locationId: "Location",
  programContext: "Program",
  breakStartDate: "Study break start date",
  breakEndDate: "Study break end date",
};

/**
 * Provides a user-friendly message to a field that needs date validation.
 * @param propertyDisplayName property display name.
 * @returns friendly message to the field the that needs date validation.
 */
function getDateFormatMessage(propertyDisplayName: string) {
  return `${propertyDisplayName} must be in the format ${DATE_ONLY_ISO_FORMAT}`;
}

/**
 * Provides a user-friendly message to a field that needs min number validation.
 * @param propertyDisplayName property display name.
 * @returns friendly message to the field the that needs min number validation.
 */
function getMinFormatMessage(propertyDisplayName: string, min = 0) {
  return `${propertyDisplayName} must be at least ${min}.`;
}

/**
 * Provides a user-friendly message to a field that needs max number validation.
 * @param propertyDisplayName property display name.
 * @returns friendly message to the field the that needs max number validation.
 */
function getMaxFormatMessage(propertyDisplayName: string, max: number) {
  return `${propertyDisplayName} must be not greater than ${max}.`;
}

/**
 * Provides a user-friendly message to a field that needs currency validation.
 * @param propertyDisplayName property display name.
 * @returns friendly message to the field the that needs currency validation.
 */
export function getCurrencyFormatMessage(propertyDisplayName: string) {
  return `${propertyDisplayName} must be a number without a group separator or decimals.`;
}

/**
 * Provides a user-friendly message to a field that needs a enum like validation.
 * @param propertyDisplayName property display name.
 * @returns friendly message to the field the that needs a enum like validation.
 */
export function getEnumFormatMessage(
  propertyDisplayName: string,
  enumObject: unknown,
) {
  return `${propertyDisplayName} must be one of the following options: ${Object.values(
    enumObject,
  ).join()}`;
}

/**
 * Provides a user-friendly message to a field that has a max length constraint.
 * @param propertyDisplayName property display name.
 * @returns user-friendly message to the field that has a max length constraint.
 */
export function getMaxLengthFormatMessage(
  propertyDisplayName: string,
  maxLength: number,
) {
  return `${propertyDisplayName} should not be longer than ${maxLength} characters.`;
}

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
  OfferingValidationModel,
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

/**
 * Possible warnings unique identifiers.
 * !These keys are also consumed in the UI to display/hide warning banners.
 */
export enum OfferingValidationWarnings {
  InvalidStudyBreakAmountOfDays = "invalidStudyBreakAmountOfDays",
  ProgramOfferingIntensityMismatch = "programOfferingIntensityMismatch",
  ProgramOfferingDeliveryMismatch = "programOfferingDeliveryMismatch",
  ProgramOfferingWILMismatch = "programOfferingWILMismatch",
  InvalidStudyDatesPeriodLength = "invalidStudyDatesPeriodLength",
}

/**
 * Possible information unique identifiers.
 * !These keys are also consumed in the UI to display/hide info banners.
 */
export enum OfferingValidationInfos {
  InvalidStudyBreaksCombinedThresholdPercentage = "invalidStudyBreaksCombinedThresholdPercentage",
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
    warningTypeCode: OfferingValidationWarnings,
  ): ValidationContext {
    const newContext = new ValidationContext();
    newContext.type = ValidationContextTypes.Warning;
    newContext.typeCode = warningTypeCode;
    return newContext;
  }

  /**
   * Creates an error context that will make the error downgraded to
   * a condition of a simple information that will still allow the
   * offering to be automatically approved.
   * @param infoTypeCode information code that uniquely identifies this condition.
   * @returns the information context.
   */
  static CreateInfo(infoTypeCode: OfferingValidationInfos): ValidationContext {
    const newContext = new ValidationContext();
    newContext.type = ValidationContextTypes.Information;
    newContext.typeCode = infoTypeCode;
    return newContext;
  }

  /**
   * Context type.
   */
  type: ValidationContextTypes;
  /**
   * Unique identifier of the validation error.
   */
  typeCode: OfferingValidationWarnings | OfferingValidationInfos;
}

/**
 * Types of non-critical errors that will not prevent
 * the offering from being saved.
 */
export enum ValidationContextTypes {
  Warning = "warning",
  Information = "information",
}

/**
 * Offering delivery options.
 */
export enum OfferingDeliveryOptions {
  Onsite = "onsite",
  Online = "online",
  Blended = "blended",
}

/**
 * WIL(work-integrated learning) options.
 */
export enum WILComponentOptions {
  Yes = "yes",
  No = "no",
}

/**
 * Offering study breaks.
 */
export class StudyBreak {
  /**
   * Study break start date.
   */
  @IsDateString(undefined, {
    message: getDateFormatMessage(userFriendlyNames.breakStartDate),
  })
  @IsPeriodStartDate()
  breakStartDate: string;
  /**
   * Study break end date.
   */
  @IsDateString(undefined, {
    message: getDateFormatMessage(userFriendlyNames.breakEndDate),
  })
  @IsPeriodEndDate()
  @PeriodMinLength(
    (studyBreak: StudyBreak) => studyBreak.breakStartDate,
    OFFERING_STUDY_BREAK_MIN_DAYS,
    userFriendlyNames.breakEndDate,
  )
  @PeriodMaxLength(
    (studyBreak: StudyBreak) => studyBreak.breakStartDate,
    OFFERING_STUDY_BREAK_MAX_DAYS,
    userFriendlyNames.breakEndDate,
    {
      context: ValidationContext.CreateWarning(
        OfferingValidationWarnings.InvalidStudyBreakAmountOfDays,
      ),
    },
  )
  breakEndDate: string;
}

/**
 * Study start date property used as parameters in some validators.
 */
const studyStartDateProperty = (offering: OfferingValidationModel) =>
  offering.studyStartDate;
/**
 * Study end date property used as parameters in some validators.
 */
const studyEndDateProperty = (offering: OfferingValidationModel) =>
  offering.studyEndDate;

/**
 * Complete offering data with all validations needed to ensure data
 * consistency. Program data and locations data need to be present to
 * ensure a successfully validation.
 * Must be used for any offering created or updated.
 */
export class OfferingValidationModel {
  /**
   * Offering name.
   */
  @IsNotEmpty({ message: `${userFriendlyNames.offeringName} is required.` })
  @MaxLength(OFFERING_NAME_MAX_LENGTH, {
    message: getMaxLengthFormatMessage(
      userFriendlyNames.offeringName,
      OFFERING_NAME_MAX_LENGTH,
    ),
  })
  offeringName: string;
  /**
   * Offering study start date.
   */
  @IsDateString(undefined, {
    message: getDateFormatMessage(userFriendlyNames.studyStartDate),
  })
  studyStartDate: string;
  /**
   * Offering study end date.
   */
  @IsDateString(undefined, {
    message: getDateFormatMessage(userFriendlyNames.studyEndDate),
  })
  @IsDateAfter(studyStartDateProperty, userFriendlyNames.studyEndDate)
  @PeriodMinLength(
    studyStartDateProperty,
    OFFERING_STUDY_PERIOD_MIN_DAYS,
    userFriendlyNames.studyEndDate,
    {
      context: ValidationContext.CreateWarning(
        OfferingValidationWarnings.InvalidStudyDatesPeriodLength,
      ),
    },
  )
  @PeriodMaxLength(
    studyStartDateProperty,
    OFFERING_STUDY_PERIOD_MAX_DAYS,
    userFriendlyNames.studyEndDate,
    {
      context: ValidationContext.CreateWarning(
        OfferingValidationWarnings.InvalidStudyDatesPeriodLength,
      ),
    },
  )
  studyEndDate: string;
  /**
   * Actual tuition costs.
   */
  @Min(0, {
    message: getMinFormatMessage(userFriendlyNames.actualTuitionCosts),
  })
  @Max(MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE, {
    message: getMaxFormatMessage(
      userFriendlyNames.actualTuitionCosts,
      MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE,
    ),
  })
  @IsNumber(currencyNumberOptions, {
    message: getCurrencyFormatMessage(userFriendlyNames.actualTuitionCosts),
  })
  actualTuitionCosts: number;
  /**
   * Program related costs.
   */
  @Min(0, {
    message: getMinFormatMessage(userFriendlyNames.programRelatedCosts),
  })
  @Max(MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE, {
    message: getMaxFormatMessage(
      userFriendlyNames.programRelatedCosts,
      MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE,
    ),
  })
  @IsNumber(currencyNumberOptions, {
    message: getCurrencyFormatMessage(userFriendlyNames.programRelatedCosts),
  })
  programRelatedCosts: number;
  /**
   * Mandatory fees.
   */
  @Min(0, {
    message: getMinFormatMessage(userFriendlyNames.mandatoryFees),
  })
  @Max(MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE, {
    message: getMaxFormatMessage(
      userFriendlyNames.mandatoryFees,
      MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE,
    ),
  })
  @IsNumber(currencyNumberOptions, {
    message: getCurrencyFormatMessage(userFriendlyNames.mandatoryFees),
  })
  mandatoryFees: number;
  /**
   * Exceptional expenses.
   */
  @Min(0, {
    message: getMinFormatMessage(userFriendlyNames.exceptionalExpenses),
  })
  @Max(MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE, {
    message: getMaxFormatMessage(
      userFriendlyNames.exceptionalExpenses,
      MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE,
    ),
  })
  @IsNumber(currencyNumberOptions, {
    message: getCurrencyFormatMessage(userFriendlyNames.exceptionalExpenses),
  })
  exceptionalExpenses: number;
  /**
   * Offering delivered type.
   */
  @IsEnum(OfferingDeliveryOptions, {
    message: getEnumFormatMessage(
      userFriendlyNames.offeringDelivered,
      OfferingDeliveryOptions,
    ),
  })
  @ValidateIf((offering: OfferingValidationModel) => !!offering.programContext)
  @ProgramAllowsOfferingDelivery(userFriendlyNames.offeringDelivered, {
    context: ValidationContext.CreateWarning(
      OfferingValidationWarnings.ProgramOfferingDeliveryMismatch,
    ),
  })
  offeringDelivered: OfferingDeliveryOptions;
  /**
   * Offering intensity.
   */
  @IsEnum(OfferingIntensity)
  @ValidateIf((offering: OfferingValidationModel) => !!offering.programContext)
  @ProgramAllowsOfferingIntensity(userFriendlyNames.offeringIntensity, {
    context: ValidationContext.CreateWarning(
      OfferingValidationWarnings.ProgramOfferingIntensityMismatch,
    ),
  })
  offeringIntensity: OfferingIntensity;
  /**
   * Number of years of study.
   */
  @Min(OFFERING_YEAR_OF_STUDY_MIN_VALUE, {
    message: getMinFormatMessage(
      userFriendlyNames.yearOfStudy,
      OFFERING_YEAR_OF_STUDY_MIN_VALUE,
    ),
  })
  @Max(OFFERING_YEAR_OF_STUDY_MAX_VALUE, {
    message: getMaxFormatMessage(
      userFriendlyNames.yearOfStudy,
      OFFERING_YEAR_OF_STUDY_MAX_VALUE,
    ),
  })
  yearOfStudy: number;
  /**
   * Show year of study.
   */
  @IsBoolean({
    message: `${userFriendlyNames.showYearOfStudy} must be a valid boolean value.`,
  })
  showYearOfStudy: boolean;
  /**
   * Indicates if the offering has a WIL(work-integrated learning).
   */
  @IsEnum(WILComponentOptions, {
    message: getEnumFormatMessage(
      userFriendlyNames.hasOfferingWILComponent,
      WILComponentOptions,
    ),
  })
  @ValidateIf((offering: OfferingValidationModel) => !!offering.programContext)
  @ProgramAllowsOfferingWIL(userFriendlyNames.hasOfferingWILComponent, {
    context: ValidationContext.CreateWarning(
      OfferingValidationWarnings.ProgramOfferingWILMismatch,
    ),
  })
  hasOfferingWILComponent: WILComponentOptions;
  /**
   * For an offering that has a WIL(work-integrated learning),
   * indicates which type.
   */
  @ValidateIf(
    (offering: OfferingValidationModel) =>
      offering.hasOfferingWILComponent === WILComponentOptions.Yes,
  )
  @IsNotEmpty({
    message: `${userFriendlyNames.offeringWILComponentType} is required when ${userFriendlyNames.hasOfferingWILComponent} is set to '${WILComponentOptions.Yes}'.`,
  })
  @MaxLength(OFFERING_WIL_TYPE_MAX_LENGTH, {
    message: getMaxLengthFormatMessage(
      userFriendlyNames.offeringWILComponentType,
      OFFERING_WIL_TYPE_MAX_LENGTH,
    ),
  })
  offeringWILComponentType?: string;
  /**
   * User consent to have the offering submitted.
   */
  @IsIn([true], {
    message: `${userFriendlyNames.offeringDeclaration} must be accepted.`,
  })
  offeringDeclaration: boolean;
  /**
   * Define if the offering will be available to the
   * public or must be hidden.
   */
  @IsIn([OfferingTypes.Private, OfferingTypes.Public], {
    message: `${userFriendlyNames.offeringType} must be either ${OfferingTypes.Private} or ${OfferingTypes.Public}.`,
  })
  offeringType: OfferingTypes;
  /**
   * Indicates the offering course load for part-time application only.
   */
  @ValidateIf(
    (offering: OfferingValidationModel) =>
      offering.offeringIntensity === OfferingIntensity.partTime,
  )
  @Min(OFFERING_COURSE_LOAD_MIN_VALUE, {
    message: getMinFormatMessage(
      userFriendlyNames.courseLoad,
      OFFERING_COURSE_LOAD_MIN_VALUE,
    ),
  })
  @Max(OFFERING_COURSE_LOAD_MAX_VALUE, {
    message: getMaxFormatMessage(
      userFriendlyNames.courseLoad,
      OFFERING_COURSE_LOAD_MAX_VALUE,
    ),
  })
  courseLoad?: number;
  /**
   * Indicates if the offering has some study break.
   */
  @IsBoolean({
    message: `${userFriendlyNames.lacksStudyBreaks} must be a boolean value.`,
  })
  lacksStudyBreaks: boolean;
  /**
   * For offerings with some study break, represents all study break periods.
   */
  @Type(() => StudyBreak)
  @ValidateIf(
    (offering: OfferingValidationModel) =>
      !offering.lacksStudyBreaks &&
      !!offering.studyStartDate &&
      !!offering.studyEndDate,
  )
  @ArrayMinSize(1, {
    message:
      "An offering with study breaks must contain at least one complete study break.",
  })
  @ValidateNested({ each: true })
  @HasNoPeriodOverlap(userFriendlyNames.studyBreaks)
  @PeriodsAreBetweenLimits(
    studyStartDateProperty,
    studyEndDateProperty,
    userFriendlyNames.studyBreaks,
  )
  @StudyBreaksCombinedMustNotExceedsThreshold(
    studyStartDateProperty,
    studyEndDateProperty,
    {
      context: ValidationContext.CreateInfo(
        OfferingValidationInfos.InvalidStudyBreaksCombinedThresholdPercentage,
      ),
    },
  )
  @HasValidOfferingPeriodForFundedDays(
    studyStartDateProperty,
    studyEndDateProperty,
    {
      context: ValidationContext.CreateWarning(
        OfferingValidationWarnings.InvalidStudyDatesPeriodLength,
      ),
    },
  )
  studyBreaks: StudyBreak[];
  /**
   * Institution location that will be associated with this offering.
   */
  @IsPositive({
    message: "Related institution location was not found or was not provided.",
  })
  locationId: number;
  /**
   * Program information required to execute the offering validation.
   */
  @ValidateIf((offering: OfferingValidationModel) => !!offering.locationId)
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
export interface ValidationResult {
  typeCode: OfferingValidationWarnings | OfferingValidationInfos;
  message: string;
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
  offeringModel: OfferingValidationModel;
  /**
   * Offering status defined from the validation results.
   * - Approved: no critical errors and no warnings.
   * - CreationPending: no critical errors and some warnings.
   * - Undefined: some critical error.
   */
  offeringStatus?: OfferingStatus.Approved | OfferingStatus.CreationPending;
  /**
   * Infos, if any.
   */
  infos: ValidationResult[];
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
 * Result of the fail attempt to insert the validated offering into the database.
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
}
