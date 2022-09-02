import {
  ArrayMinSize,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsPositive,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
  ValidationError,
} from "class-validator";
import { IsDateAfter } from "../../utilities/class-validation/custom-validators/is-date-after";
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

export type EducationProgramForOfferingValidationContext = Pick<
  EducationProgram,
  | "id"
  | "programIntensity"
  | "hasWILComponent"
  | "deliveredOnSite"
  | "deliveredOnline"
>;

export type OfferingStudyBreakCalculationContext = Pick<
  SaveOfferingModel,
  "studyEndDate" | "studyStartDate" | "studyBreaks"
>;
export type CalculatedStudyBreaksAndWeeks = StudyBreaksAndWeeks & {
  sumOfTotalEligibleBreakDays: number;
  sumOfTotalIneligibleBreakDays: number;
};

export interface EducationProgramValidationContext {
  programContext: EducationProgramForOfferingValidationContext;
}

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

export enum ProgramDeliveryOptions {
  Onsite = "onsite",
  Online = "online",
  Blended = "blended",
}

export enum WILComponentOptions {
  Yes = "yes",
  No = "no",
}

export class ProgramDeliveryTypes {
  @IsBoolean()
  deliveredOnSite: boolean;
  @IsBoolean()
  deliveredOnline: boolean;
}

export class StudyBreak {
  @IsDateString()
  @IsPeriodStartDate()
  breakStartDate: string;
  @IsDateString()
  @IsPeriodEndDate()
  @IsDateAfter((studyBreak: StudyBreak) => studyBreak.breakStartDate)
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

const studyStartDateProperty = (offering: SaveOfferingModel) =>
  offering.studyStartDate;
const studyEndDateProperty = (offering: SaveOfferingModel) =>
  offering.studyEndDate;

export class SaveOfferingModel implements EducationProgramValidationContext {
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
  actualTuitionCosts: number;
  @Min(0)
  @Max(MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE)
  programRelatedCosts: number;
  @Min(0)
  @Max(MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE)
  mandatoryFees: number;
  @Min(0)
  @Max(MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE)
  exceptionalExpenses: number;
  @IsEnum(ProgramDeliveryOptions)
  @ProgramAllowsOfferingDelivery({
    context: new ValidationWarning(
      OfferingValidationWarnings.ProgramOfferingDeliveryMismatch,
    ),
  })
  offeringDelivered: string;
  @IsEnum(OfferingIntensity)
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
  offeringWILComponentType: string;
  @IsIn([true])
  offeringDeclaration: boolean;
  @ValidateNested()
  @Type(() => ProgramDeliveryTypes)
  programDeliveryTypes: ProgramDeliveryTypes;
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

export interface OfferingValidationResult {
  offeringModel: SaveOfferingModel;
  offeringStatus?: OfferingStatus.Approved | OfferingStatus.CreationPending;
  warnings: OfferingValidationWarnings[];
  errors: ValidationError[];
  flattenedErrors: string[];
}
