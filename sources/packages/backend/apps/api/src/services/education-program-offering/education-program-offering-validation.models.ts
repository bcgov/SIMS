import {
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
} from "class-validator";
import {
  EducationProgram,
  OfferingIntensity,
  OfferingStatus,
  OfferingTypes,
  OFFERING_NAME_MAX_LENGTH,
  OFFERING_WIL_TYPE_MAX_LENGTH,
  StudyBreaksAndWeeks,
  InstitutionType,
} from "@sims/sims-db";
import {
  IsPeriodStartDate,
  IsPeriodEndDate,
  HasNoPeriodOverlap,
  PeriodsAreBetweenLimits,
  PeriodMinLength,
  PeriodMaxLength,
  IsDateAfter,
  ValidationResult,
  ValidationContext,
  IsMaxCostValue,
  AllowIf,
  IsNumberGreaterThan,
} from "../../utilities/class-validation";
import { Type } from "class-transformer";
import { ProgramAllowsOfferingIntensity } from "./custom-validators/program-allows-offering-intensity";
import { ProgramAllowsOfferingDelivery } from "./custom-validators/program-allows-offering-delivery";
import { ProgramAllowsOfferingWIL } from "./custom-validators/program-allows-offering-wil";
import { StudyBreaksCombinedMustNotExceedsThreshold } from "./custom-validators/study-break-has-valid-consecutive-threshold";
import { HasValidOfferingPeriodForFundedWeeks } from "./custom-validators/has-valid-offering-period-for-funded-weeks";
import { ProgramAllowsAviation } from "./custom-validators/program-allows-aviation";
import { ProgramAviationCredentialMismatch } from "./custom-validators/program-allows-aviation-credential";
import { HasFundedWeeksWithinMaximumLimit } from "./custom-validators/has-funded-weeks-within-maximum-limit";
import {
  MAX_ALLOWED_OFFERING_AMOUNT,
  MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE,
  OFFERING_COURSE_LOAD_MAX_VALUE,
  OFFERING_COURSE_LOAD_MIN_VALUE,
  OFFERING_MAXIMUM_ONLINE_DURATION_PERCENTAGE,
  OFFERING_MINIMUM_ONLINE_DURATION_PERCENTAGE,
  OFFERING_STUDY_BREAK_MAX_DAYS,
  OFFERING_STUDY_BREAK_MIN_DAYS,
  OFFERING_STUDY_PERIOD_MAX_DAYS,
  OFFERING_STUDY_PERIOD_MIN_FUNDED_WEEKS_FULL_TIME,
  OFFERING_STUDY_PERIOD_MIN_FUNDED_WEEKS_PART_TIME,
  OFFERING_YEAR_OF_STUDY_MAX_VALUE,
  OFFERING_YEAR_OF_STUDY_MIN_VALUE,
} from "../../utilities";
import { DATE_ONLY_ISO_FORMAT } from "@sims/utilities";
import { YesNoOptions } from "@sims/test-utils";

/**
 * User friendly names for the fields.
 */
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
  isAviationOffering: "Aviation Offering",
  aviationCredentialType: "Aviation credential type",
  hasOfferingWILComponent: "WIL Component",
  offeringWILComponentType: "WIL Component Type",
  offeringDeclaration: "Consent",
  offeringType: "Offering type",
  courseLoad: "Course load",
  lacksStudyBreaks: "Lacks study breaks",
  studyBreaks: "Study breaks",
  locationId: "Location",
  locationName: "LocationName",
  programContext: "Program",
  breakStartDate: "Study break start date",
  breakEndDate: "Study break end date",
  onlineInstructionMode: "Online instruction mode",
  isOnlineDurationSameAlways: "Online duration same always",
  totalOnlineDuration: "Total online duration",
  minimumOnlineDuration: "Minimum online duration",
  maximumOnlineDuration: "Maximum online duration",
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
  | "name"
  | "programIntensity"
  | "hasWILComponent"
  | "deliveredOnSite"
  | "deliveredOnline"
  | "isAviationProgram"
  | "credentialTypesAviation"
>;

/**
 * Institution details required to perform the offering validations.
 */
export type InstitutionValidationContext = Pick<
  InstitutionType,
  "isBCPublic" | "isBCPrivate"
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
  ProgramOfferingIntensityMismatch = "programOfferingIntensityMismatch",
  ProgramOfferingDeliveryMismatch = "programOfferingDeliveryMismatch",
  ProgramOfferingWILMismatch = "programOfferingWILMismatch",
  InvalidStudyDatesPeriodLength = "invalidStudyDatesPeriodLength",
  InvalidFundedStudyPeriodLength = "invalidFundedStudyPeriodLength",
  OfferingCostExceedMaximum = "offeringCostExceedMaximum",
  ProgramNotAviation = "programNotAviation",
  ProgramAviationCredentialMismatch = "programAviationCredentialMismatch",
  AviationCredIsPrivatePilotTraining = "aviationCredIsPrivatePilotTraining",
  InvalidFundedWeeksForAviationOfferingCredentials = "invalidFundedWeeksForAviationOfferingCredentials",
}

/**
 * Possible information unique identifiers.
 * !These keys are also consumed in the UI to display/hide info banners.
 */
export enum OfferingValidationInfos {
  InvalidStudyBreakAmountOfDays = "invalidStudyBreakAmountOfDays",
  InvalidStudyBreaksCombinedThresholdPercentage = "invalidStudyBreaksCombinedThresholdPercentage",
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
 * Offering Yes/No options.
 */
export enum OfferingYesNoOptions {
  Yes = "yes",
  No = "no",
}

/**
 * Aviation Credential Type options.
 */
export enum AviationCredentialTypeOptions {
  CommercialPilotTraining = "commercialPilotTraining",
  InstructorsRating = "instructorsRating",
  Endorsements = "endorsements",
  PrivatePilotTraining = "privatePilotTraining",
}

/**
 * Offering online instruction modes.
 */
export enum OnlineInstructionModeOptions {
  SynchronousOnly = "synchronousOnly",
  AsynchronousOnly = "asynchronousOnly",
  SynchronousAndAsynchronous = "synchronousAndAsynchronous",
}

/**
 * Institution context conditions.
 */
enum InstitutionContextConditions {
  BCPrivateWithDeliveryOptionBlended = "BCPrivateWithDeliveryOptionBlended",
  BCPrivateWithDeliveryOptionOnlineOrBlended = "BCPrivateWithDeliveryOptionOnlineOrBlended",
  AllowOnlineDeliveryInputs = "AllowOnlineDeliveryInputs",
  BCPrivateOrPublicWithDeliveryOptionBlended = "BCPrivateOrPublicWithDeliveryOptionBlended",
}

const aviationCredentialTypesEligibleForFunding = [
  AviationCredentialTypeOptions.CommercialPilotTraining,
  AviationCredentialTypeOptions.InstructorsRating,
  AviationCredentialTypeOptions.Endorsements,
];

/**
 * Maximum allowed funded weeks for each aviation credential type
 * that should be enforced when calculating the funded weeks.
 */
const MAX_FUNDED_WEEKS = {
  [AviationCredentialTypeOptions.CommercialPilotTraining]: 17,
  [AviationCredentialTypeOptions.InstructorsRating]: 13,
  [AviationCredentialTypeOptions.Endorsements]: 13,
};

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
      context: ValidationContext.CreateInfo(
        OfferingValidationInfos.InvalidStudyBreakAmountOfDays,
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
 * Get study period minimum funded weeks based on offering intensity.
 * @param offering offering.
 * @returns minimum study period length in number of weeks.
 */
const studyPeriodMinFundedWeeks = (offering: OfferingValidationModel) => {
  if (offering.offeringIntensity === OfferingIntensity.fullTime) {
    return OFFERING_STUDY_PERIOD_MIN_FUNDED_WEEKS_FULL_TIME;
  }
  return OFFERING_STUDY_PERIOD_MIN_FUNDED_WEEKS_PART_TIME;
};

/**
 * Validate the offering based on the institution context and the condition provided.
 * @param offering offering.
 * @param condition institution context condition.
 * @returns condition result.
 */
function hasInstitutionContext(
  offering: OfferingValidationModel,
  condition: InstitutionContextConditions,
): boolean {
  switch (condition) {
    case InstitutionContextConditions.BCPrivateWithDeliveryOptionBlended:
      return (
        offering.institutionContext?.isBCPrivate &&
        offering.offeringDelivered === OfferingDeliveryOptions.Blended
      );
    case InstitutionContextConditions.BCPrivateWithDeliveryOptionOnlineOrBlended:
      return (
        offering.institutionContext?.isBCPrivate &&
        [
          OfferingDeliveryOptions.Online,
          OfferingDeliveryOptions.Blended,
        ].includes(offering.offeringDelivered)
      );
    case InstitutionContextConditions.BCPrivateOrPublicWithDeliveryOptionBlended:
      return (
        (offering.institutionContext?.isBCPrivate ||
          offering.institutionContext?.isBCPublic) &&
        offering.offeringDelivered === OfferingDeliveryOptions.Blended
      );
    case InstitutionContextConditions.AllowOnlineDeliveryInputs:
      return (
        (offering.institutionContext?.isBCPublic ||
          offering.institutionContext?.isBCPrivate) &&
        [
          OfferingDeliveryOptions.Online,
          OfferingDeliveryOptions.Blended,
        ].includes(offering.offeringDelivered)
      );
    default:
      return false;
  }
}

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
  @IsNumber(currencyNumberOptions, {
    message: getCurrencyFormatMessage(userFriendlyNames.actualTuitionCosts),
  })
  @Max(MAX_ALLOWED_OFFERING_AMOUNT, {
    context: ValidationContext.CreateWarning(
      OfferingValidationWarnings.OfferingCostExceedMaximum,
    ),
    message: getMaxFormatMessage(
      userFriendlyNames.actualTuitionCosts,
      MAX_ALLOWED_OFFERING_AMOUNT,
    ),
  })
  @IsMaxCostValue(userFriendlyNames.actualTuitionCosts, {
    message: getMaxFormatMessage(
      userFriendlyNames.actualTuitionCosts,
      MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE,
    ),
  })
  actualTuitionCosts: number;
  /**
   * Program related costs.
   */
  @Min(0, {
    message: getMinFormatMessage(userFriendlyNames.programRelatedCosts),
  })
  @Max(MAX_ALLOWED_OFFERING_AMOUNT, {
    context: ValidationContext.CreateWarning(
      OfferingValidationWarnings.OfferingCostExceedMaximum,
    ),
    message: getMaxFormatMessage(
      userFriendlyNames.programRelatedCosts,
      MAX_ALLOWED_OFFERING_AMOUNT,
    ),
  })
  @IsMaxCostValue(userFriendlyNames.programRelatedCosts, {
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
  @Max(MAX_ALLOWED_OFFERING_AMOUNT, {
    context: ValidationContext.CreateWarning(
      OfferingValidationWarnings.OfferingCostExceedMaximum,
    ),
    message: getMaxFormatMessage(
      userFriendlyNames.mandatoryFees,
      MAX_ALLOWED_OFFERING_AMOUNT,
    ),
  })
  @IsMaxCostValue(userFriendlyNames.mandatoryFees, {
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
  @Max(MAX_ALLOWED_OFFERING_AMOUNT, {
    context: ValidationContext.CreateWarning(
      OfferingValidationWarnings.OfferingCostExceedMaximum,
    ),
    message: getMaxFormatMessage(
      userFriendlyNames.exceptionalExpenses,
      MAX_ALLOWED_OFFERING_AMOUNT,
    ),
  })
  @IsMaxCostValue(userFriendlyNames.exceptionalExpenses, {
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
   * Indicates if the offering is an aviation offering.
   */
  @IsEnum(OfferingYesNoOptions, {
    message: getEnumFormatMessage(
      userFriendlyNames.isAviationOffering,
      OfferingYesNoOptions,
    ),
  })
  @ValidateIf((offering: OfferingValidationModel) => !!offering.programContext)
  @ProgramAllowsAviation(userFriendlyNames.isAviationOffering, {
    context: ValidationContext.CreateWarning(
      OfferingValidationWarnings.ProgramNotAviation,
    ),
  })
  isAviationOffering: OfferingYesNoOptions;
  /**
   * Indicates the aviation credential for the offering.
   */
  @IsEnum(AviationCredentialTypeOptions, {
    message: getEnumFormatMessage(
      userFriendlyNames.aviationCredentialType,
      AviationCredentialTypeOptions,
    ),
  })
  @AllowIf(
    (offering: OfferingValidationModel) =>
      offering.isAviationOffering === OfferingYesNoOptions.Yes,
    userFriendlyNames.aviationCredentialType,
  )
  @ValidateIf(
    (offering: OfferingValidationModel) =>
      offering.isAviationOffering === OfferingYesNoOptions.Yes,
  )
  /**
   * The aviation credential types other than the ones listed as eligible for funding below will cause the below validation to be failed.
   */
  @IsIn(aviationCredentialTypesEligibleForFunding, {
    context: ValidationContext.CreateWarning(
      OfferingValidationWarnings.AviationCredIsPrivatePilotTraining,
    ),
  })
  @ProgramAviationCredentialMismatch(userFriendlyNames.aviationCredentialType, {
    context: ValidationContext.CreateWarning(
      OfferingValidationWarnings.ProgramAviationCredentialMismatch,
    ),
  })
  aviationCredentialType?: string;
  /**
   * Indicates if the offering has a WIL(work-integrated learning).
   */
  @IsEnum(OfferingYesNoOptions, {
    message: getEnumFormatMessage(
      userFriendlyNames.hasOfferingWILComponent,
      OfferingYesNoOptions,
    ),
  })
  @ValidateIf((offering: OfferingValidationModel) => !!offering.programContext)
  @ProgramAllowsOfferingWIL(userFriendlyNames.hasOfferingWILComponent, {
    context: ValidationContext.CreateWarning(
      OfferingValidationWarnings.ProgramOfferingWILMismatch,
    ),
  })
  hasOfferingWILComponent: OfferingYesNoOptions;
  /**
   * For an offering that has a WIL(work-integrated learning),
   * indicates which type.
   */
  @ValidateIf(
    (offering: OfferingValidationModel) =>
      offering.hasOfferingWILComponent === OfferingYesNoOptions.Yes,
  )
  @IsNotEmpty({
    message: `${userFriendlyNames.offeringWILComponentType} is required when ${userFriendlyNames.hasOfferingWILComponent} is set to '${YesNoOptions.Yes}'.`,
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
      !!offering.studyStartDate && !!offering.studyEndDate,
  )
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
  @HasValidOfferingPeriodForFundedWeeks(
    studyStartDateProperty,
    studyEndDateProperty,
    studyPeriodMinFundedWeeks,
    {
      context: ValidationContext.CreateWarning(
        OfferingValidationWarnings.InvalidFundedStudyPeriodLength,
      ),
    },
  )
  @HasFundedWeeksWithinMaximumLimit(
    studyStartDateProperty,
    studyEndDateProperty,
    (aviationCredentialType: string) =>
      MAX_FUNDED_WEEKS[aviationCredentialType],
    {
      context: ValidationContext.CreateWarning(
        OfferingValidationWarnings.InvalidFundedWeeksForAviationOfferingCredentials,
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
   * Institution location name of the institution that will be associated with this offering.
   * Used as supporting data, for instance, as part of the notification to indicate offering in pending status.
   */
  @IsNotEmpty({ message: "Institution location name is required." })
  locationName: string;
  /**
   * Institution operating name used as supporting data, for instance, as part of the notification to indicate offering in pending status.
   */
  @IsNotEmpty({ message: "Institution operating name is required." })
  operatingName: string;
  /**
   * Institution legal operating name used as supporting data, for instance, as part of the notification to indicate offering in pending status.
   */
  @IsNotEmpty({ message: "Institution legal operating name is required." })
  legalOperatingName: string;
  /**
   * Institution primary email, used as supporting data, for instance, as part of the notification to indicate offering in pending status.
   */
  @IsNotEmpty({ message: "Institution primary email is required." })
  primaryEmail: string;
  /**
   * Program information required to execute the offering validation.
   */
  @ValidateIf((offering: OfferingValidationModel) => !!offering.locationId)
  @IsNotEmptyObject(undefined, {
    message:
      "Not able to find a program related to this offering or it was not provided.",
  })
  programContext: EducationProgramForOfferingValidationContext;
  /**
   * Institution information required to execute the offering validation.
   */
  @IsOptional()
  // When the context is provided, it must be valid.
  @IsNotEmptyObject(undefined, {
    message: "Not able to find the institution of the offering.",
  })
  institutionContext?: InstitutionValidationContext;
  /**
   * Offering mode(s) of online instruction.
   */
  @ValidateIf(
    // Validate when the property must have a value or it already has a value.
    (offering: OfferingValidationModel) =>
      hasInstitutionContext(
        offering,
        InstitutionContextConditions.BCPrivateWithDeliveryOptionOnlineOrBlended,
      ) || !!offering.onlineInstructionMode,
  )
  // Allow the property only when the institution either BC Public or BC Private and the offering is online or blended.
  @AllowIf(
    (offering: OfferingValidationModel) =>
      hasInstitutionContext(
        offering,
        InstitutionContextConditions.AllowOnlineDeliveryInputs,
      ),
    undefined,
    {
      message: `${userFriendlyNames.onlineInstructionMode} is not allowed for provided institution type or offering delivery type and offering online delivery inputs.`,
    },
  )
  @IsEnum(OnlineInstructionModeOptions, {
    message: getEnumFormatMessage(
      userFriendlyNames.onlineInstructionMode,
      OnlineInstructionModeOptions,
    ),
  })
  onlineInstructionMode?: OnlineInstructionModeOptions;
  /**
   * Specifies if the blended offering will always be provided with the same total duration of online delivery.
   * Values can be "yes" or "no".
   */
  @ValidateIf(
    // Validate when the property must have a value or it already has a value.
    (offering: OfferingValidationModel) =>
      hasInstitutionContext(
        offering,
        InstitutionContextConditions.BCPrivateWithDeliveryOptionBlended,
      ) || !!offering.isOnlineDurationSameAlways,
  )
  // Allow the property only when the institution either BC Public or BC Private and the offering is blended.
  @AllowIf(
    (offering: OfferingValidationModel) =>
      hasInstitutionContext(
        offering,
        InstitutionContextConditions.BCPrivateOrPublicWithDeliveryOptionBlended,
      ),
    undefined,
    {
      message: `${userFriendlyNames.isOnlineDurationSameAlways} is not allowed for provided institution type or offering delivery type and offering online delivery inputs.`,
    },
  )
  @IsEnum(OfferingYesNoOptions, {
    message: getEnumFormatMessage(
      userFriendlyNames.isOnlineDurationSameAlways,
      OfferingYesNoOptions,
    ),
  })
  isOnlineDurationSameAlways?: OfferingYesNoOptions;
  /**
   * Percentage of total duration that will be provided by online delivery in the blended offering.
   */
  @ValidateIf(
    // Validate when the property must have a value or it already has a value.
    (offering: OfferingValidationModel) =>
      (hasInstitutionContext(
        offering,
        InstitutionContextConditions.BCPrivateWithDeliveryOptionBlended,
      ) &&
        offering.isOnlineDurationSameAlways === OfferingYesNoOptions.Yes) ||
      (offering.totalOnlineDuration !== null &&
        offering.totalOnlineDuration !== undefined),
  )
  // Allow the property only when the institution either BC Public or BC Private and the offering is blended
  // and the online duration is same always.
  @AllowIf(
    (offering: OfferingValidationModel) =>
      hasInstitutionContext(
        offering,
        InstitutionContextConditions.BCPrivateOrPublicWithDeliveryOptionBlended,
      ) && offering.isOnlineDurationSameAlways === OfferingYesNoOptions.Yes,
    undefined,
    {
      message: `${userFriendlyNames.totalOnlineDuration} is not allowed for provided institution type or offering delivery type and offering online delivery inputs.`,
    },
  )
  @IsNumber(undefined, {
    message: `${userFriendlyNames.totalOnlineDuration} must be a number.`,
  })
  @Min(OFFERING_MINIMUM_ONLINE_DURATION_PERCENTAGE, {
    message: getMinFormatMessage(
      userFriendlyNames.totalOnlineDuration,
      OFFERING_MINIMUM_ONLINE_DURATION_PERCENTAGE,
    ),
  })
  @Max(OFFERING_MAXIMUM_ONLINE_DURATION_PERCENTAGE, {
    message: getMaxFormatMessage(
      userFriendlyNames.totalOnlineDuration,
      OFFERING_MAXIMUM_ONLINE_DURATION_PERCENTAGE,
    ),
  })
  totalOnlineDuration?: number;
  /**
   * Percentage of minimum duration that will be provided by online delivery in the blended offering.
   */
  @ValidateIf(
    // Validate when the property must have a value or it already has a value.
    (offering: OfferingValidationModel) =>
      (hasInstitutionContext(
        offering,
        InstitutionContextConditions.BCPrivateWithDeliveryOptionBlended,
      ) &&
        offering.isOnlineDurationSameAlways === OfferingYesNoOptions.No) ||
      (offering.minimumOnlineDuration !== null &&
        offering.minimumOnlineDuration !== undefined),
  )
  // Allow the property only when the institution either BC Public or BC Private and the offering is blended
  // and the online duration is not same always.
  @AllowIf(
    (offering: OfferingValidationModel) =>
      hasInstitutionContext(
        offering,
        InstitutionContextConditions.BCPrivateOrPublicWithDeliveryOptionBlended,
      ) && offering.isOnlineDurationSameAlways === OfferingYesNoOptions.No,
    undefined,
    {
      message: `${userFriendlyNames.minimumOnlineDuration} is not allowed for provided institution type or offering delivery type and offering online delivery inputs.`,
    },
  )
  @IsNumber(undefined, {
    message: `${userFriendlyNames.minimumOnlineDuration} must be a number.`,
  })
  @Min(OFFERING_MINIMUM_ONLINE_DURATION_PERCENTAGE, {
    message: getMinFormatMessage(
      userFriendlyNames.minimumOnlineDuration,
      OFFERING_MINIMUM_ONLINE_DURATION_PERCENTAGE,
    ),
  })
  @Max(OFFERING_MAXIMUM_ONLINE_DURATION_PERCENTAGE, {
    message: getMaxFormatMessage(
      userFriendlyNames.minimumOnlineDuration,
      OFFERING_MAXIMUM_ONLINE_DURATION_PERCENTAGE,
    ),
  })
  minimumOnlineDuration?: number;
  /**
   * Percentage of maximum duration that will be provided by online delivery in the blended offering.
   */
  @ValidateIf(
    // Validate when the property must have a value or it already has a value.
    (offering: OfferingValidationModel) =>
      (hasInstitutionContext(
        offering,
        InstitutionContextConditions.BCPrivateWithDeliveryOptionBlended,
      ) &&
        offering.isOnlineDurationSameAlways === OfferingYesNoOptions.No) ||
      (offering.maximumOnlineDuration !== null &&
        offering.maximumOnlineDuration !== undefined),
  )
  // Allow the property only when the institution either BC Public or BC Private and the offering is blended
  // and the online duration is not same always.
  @AllowIf(
    (offering: OfferingValidationModel) =>
      hasInstitutionContext(
        offering,
        InstitutionContextConditions.BCPrivateOrPublicWithDeliveryOptionBlended,
      ) && offering.isOnlineDurationSameAlways === OfferingYesNoOptions.No,
    undefined,
    {
      message: `${userFriendlyNames.maximumOnlineDuration} is not allowed for provided institution type or offering delivery type and offering online delivery inputs.`,
    },
  )
  @IsNumber(undefined, {
    message: `${userFriendlyNames.maximumOnlineDuration} must be a number.`,
  })
  @Min(OFFERING_MINIMUM_ONLINE_DURATION_PERCENTAGE, {
    message: getMinFormatMessage(
      userFriendlyNames.maximumOnlineDuration,
      OFFERING_MINIMUM_ONLINE_DURATION_PERCENTAGE,
    ),
  })
  @Max(OFFERING_MAXIMUM_ONLINE_DURATION_PERCENTAGE, {
    message: getMaxFormatMessage(
      userFriendlyNames.maximumOnlineDuration,
      OFFERING_MAXIMUM_ONLINE_DURATION_PERCENTAGE,
    ),
  })
  @IsNumberGreaterThan(
    (offering: OfferingValidationModel) => offering.minimumOnlineDuration,
    undefined,
    {
      message: `${userFriendlyNames.maximumOnlineDuration} must be greater than ${userFriendlyNames.minimumOnlineDuration}.`,
    },
  )
  maximumOnlineDuration?: number;
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
