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
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { IsDateAfter } from "../../utilities/custom-validators/is-date-after";
import {
  EducationProgram,
  OfferingIntensity,
  OfferingTypes,
  StudyBreaksAndWeeks,
} from "../../database/entities";
import {
  IsPeriodStartDate,
  IsPeriodEndDate,
  HasNoPeriodOverlap,
  PeriodsAreBetweenLimits,
  PeriodMinLength,
} from "../../utilities/custom-validators";
import { Type } from "class-transformer";
import { ProgramAllowsOfferingIntensity } from "./custom-validators/program-allows-offering-intensity";
import { ProgramAllowsOfferingDelivery } from "./custom-validators/program-allows-offering-delivery";
import { ProgramAllowsOfferingWIL } from "./custom-validators/program-allows-offering-wil";
import { PeriodMaxLength } from "src/utilities/custom-validators/period-max-length";
import { StudyBreaksCombinedMustNotExceedsThreshold } from "./custom-validators/study-break-has-valid-consecutive-threshold";
import {
  OFFERING_STUDY_BREAK_CONSECUTIVE_DAYS_THRESHOLD,
  OFFERING_STUDY_BREAK_MIN_DAYS,
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

function createWarning(warningKey: string) {
  return {
    isWaning: true,
    warningKey,
  };
}

export class StudyBreak {
  @IsDateString()
  @IsPeriodStartDate()
  breakStartDate: string;
  @IsDateString()
  @IsPeriodEndDate()
  @IsDateAfter("breakStartDate")
  @PeriodMinLength("breakStartDate", OFFERING_STUDY_BREAK_MIN_DAYS)
  @PeriodMaxLength(
    "breakStartDate",
    OFFERING_STUDY_BREAK_CONSECUTIVE_DAYS_THRESHOLD,
    {
      context: createWarning("invalidStudyBreakConsecutiveThreshold"),
    },
  )
  breakEndDate: string;
}

export class ProgramDeliveryTypes {
  @IsBoolean()
  deliveredOnSite: boolean;
  @IsBoolean()
  deliveredOnline: boolean;
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

export class SaveOfferingModel implements EducationProgramValidationContext {
  @IsNotEmpty()
  offeringName: string;
  @Min(1)
  @Max(9)
  yearOfStudy: number;
  @IsBoolean()
  showYearOfStudy: boolean;
  @IsEnum(OfferingIntensity)
  @ProgramAllowsOfferingIntensity({
    context: createWarning("programOfferingIntensityMismatch"),
  })
  offeringIntensity: OfferingIntensity;
  @IsEnum(ProgramDeliveryOptions)
  @ProgramAllowsOfferingDelivery({
    context: createWarning("programOfferingDeliveryMismatch"),
  })
  offeringDelivered: string;
  @IsEnum(WILComponentOptions)
  @ProgramAllowsOfferingWIL({
    context: createWarning("programOfferingWILMismatch"),
  })
  hasOfferingWILComponent: WILComponentOptions;
  @IsDateString()
  studyStartDate: string;
  @IsDateString()
  @IsDateAfter("studyStartDate")
  @PeriodMinLength("studyStartDate", 42)
  @PeriodMaxLength("studyStartDate", 365)
  studyEndDate: string;
  @IsBoolean()
  lacksStudyBreaks: boolean;
  @Type(() => StudyBreak)
  @ValidateIf(
    (offering) =>
      !offering.lacksStudyBreaks &&
      !!offering.studyStartDate &&
      !!offering.studyEndDate,
  )
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @HasNoPeriodOverlap()
  @PeriodsAreBetweenLimits("studyStartDate", "studyEndDate")
  @StudyBreaksCombinedMustNotExceedsThreshold()
  studyBreaks: StudyBreak[];
  @Min(0)
  actualTuitionCosts: number;
  @Min(0)
  programRelatedCosts: number;
  @Min(0)
  mandatoryFees: number;
  @Min(0)
  exceptionalExpenses: number;
  @ValidateNested()
  @Type(() => ProgramDeliveryTypes)
  programDeliveryTypes: ProgramDeliveryTypes;
  @IsIn([OfferingTypes.Private, OfferingTypes.Public])
  offeringType: OfferingTypes;
  @IsPositive({ message: "Related institution location was not found." })
  locationId: number;
  @IsBoolean()
  @IsIn([true])
  offeringDeclaration: boolean;
  @IsOptional()
  @Min(20)
  @Max(59)
  courseLoad?: number;
  @IsNotEmptyObject(undefined, {
    message: "Not able to find a program related to this offering.",
  })
  programContext: EducationProgramForOfferingValidationContext;
}
