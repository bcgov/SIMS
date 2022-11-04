import {
  OfferingTypes,
  OfferingStatus,
  NOTE_DESCRIPTION_MAX_LENGTH,
  OfferingIntensity,
} from "@sims/sims-db";
import {
  Allow,
  IsBoolean,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";
import {
  OfferingDeliveryOptions,
  OfferingValidationWarnings,
  WILComponentOptions,
} from "../../../services";

export class StudyBreakAPIOutDTO {
  breakStartDate: string;
  breakEndDate: string;
}

export class StudyBreakInDTO {
  @Allow()
  breakStartDate: string;
  @Allow()
  breakEndDate: string;
}

export class StudyBreaksAndWeeksOutDTO {
  studyBreaks: StudyBreakAPIOutDTO[];
  fundedStudyPeriodDays: number;
  totalDays: number;
  totalFundedWeeks: number;
  unfundedStudyPeriodDays: number;
}

export class StudyBreaksAndWeeksInDTO {
  @Allow()
  @Type(() => StudyBreakInDTO)
  studyBreaks: StudyBreakInDTO[];
  @Allow()
  fundedStudyPeriodDays: number;
  @Allow()
  totalDays: number;
  @Allow()
  totalFundedWeeks: number;
  @Allow()
  unfundedStudyPeriodDays: number;
}

export class StudyBreaksAndWeeksAPIOutDTO {
  studyBreaks: StudyBreakAPIOutDTO[];
  fundedStudyPeriodDays: number;
  totalDays: number;
  totalFundedWeeks: number;
  unfundedStudyPeriodDays: number;
}

export class EducationProgramOfferingAPIInDTO {
  @Allow()
  offeringName: string;
  @Allow()
  studyStartDate: string;
  @Allow()
  studyEndDate: string;
  @Allow()
  actualTuitionCosts: number;
  @Allow()
  programRelatedCosts: number;
  @Allow()
  mandatoryFees: number;
  @Allow()
  exceptionalExpenses: number;
  @Allow()
  offeringDelivered: OfferingDeliveryOptions;
  @Allow()
  lacksStudyBreaks: boolean;
  @Allow()
  offeringIntensity: OfferingIntensity;
  @Allow()
  yearOfStudy: number;
  @Allow()
  hasOfferingWILComponent: WILComponentOptions;
  @Allow()
  offeringDeclaration: boolean;
  @Allow()
  offeringStatus: OfferingStatus;
  @Allow()
  offeringType: OfferingTypes;
  @IsOptional()
  offeringWILComponentType?: string;
  @IsBoolean()
  showYearOfStudy: boolean;
  @IsOptional()
  breaksAndWeeks?: StudyBreaksAndWeeksInDTO;
  @IsOptional()
  courseLoad?: number;
}

export class EducationProgramOfferingAPIOutDTO {
  id: number;
  offeringName: string;
  studyStartDate: string;
  studyEndDate: string;
  actualTuitionCosts: number;
  programRelatedCosts: number;
  mandatoryFees: number;
  exceptionalExpenses: number;
  offeringDelivered: string;
  lacksStudyBreaks: boolean;
  offeringIntensity: OfferingIntensity;
  yearOfStudy: number;
  hasOfferingWILComponent: string;
  offeringDeclaration: boolean;
  offeringStatus: OfferingStatus;
  offeringType: OfferingTypes;
  offeringWILComponentType?: string;
  showYearOfStudy?: boolean;
  breaksAndWeeks?: StudyBreaksAndWeeksAPIOutDTO;
  assessedBy?: string;
  assessedDate?: Date;
  submittedDate: Date;
  courseLoad?: number;
  hasExistingApplication?: boolean;
  locationName?: string;
  institutionName?: string;
  warnings: string[];
}

export class EducationProgramOfferingSummaryAPIOutDTO {
  id: number;
  name: string;
  studyStartDate: string;
  studyEndDate: string;
  offeringDelivered: string;
  offeringIntensity: OfferingIntensity;
  offeringType: OfferingTypes;
  offeringStatus: OfferingStatus;
}

export class OfferingStartDateAPIOutDTO {
  studyStartDate: string;
}

export class OfferingAssessmentAPIInDTO {
  @IsEnum(OfferingStatus)
  offeringStatus: OfferingStatus;
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  assessmentNotes: string;
}

/**
 * DTO to display offering which is requested for change.
 */
export class OfferingChangeRequestAPIOutDTO {
  offeringId: number;
  programId: number;
  offeringName: string;
  institutionName: string;
  locationName: string;
  submittedDate: Date;
}

/**
 * DTO to display the summary of preceding offering details.
 */
export class PrecedingOfferingSummaryAPIOutDTO {
  applicationsCount: number;
}

export class OfferingChangeAssessmentAPIInDTO {
  @IsIn([OfferingStatus.Approved, OfferingStatus.ChangeDeclined])
  offeringStatus: OfferingStatus;
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  assessmentNotes: string;
}

/**
 * Offering validation result including study breaks
 * calculations that also supports the validation process.
 */
export class OfferingValidationResultAPIOutDTO {
  offeringStatus?: OfferingStatus.Approved | OfferingStatus.CreationPending;
  errors: string[];
  warnings: ValidationWarningResultAPIOutDTO[];
  breaksAndWeeks: StudyBreaksAndWeeksAPIOutDTO;
}

/**
 * Represents the possible errors that can happen during the
 * offerings bulk insert and provides a detailed description
 * for every record that has an error.
 */
export class OfferingBulkInsertValidationResultAPIOutDTO {
  recordIndex: number;
  locationCode?: string;
  sabcProgramCode?: string;
  startDate?: string;
  endDate?: string;
  offeringStatus?: OfferingStatus.Approved | OfferingStatus.CreationPending;
  errors: string[];
  warnings: ValidationWarningResultAPIOutDTO[];
}

/**
 * Represents an error considered not critical for
 * an offering and provides a user-friendly message
 * and a type that uniquely identifies this warning.
 */
export class ValidationWarningResultAPIOutDTO {
  warningType: OfferingValidationWarnings;
  warningMessage: string;
}
