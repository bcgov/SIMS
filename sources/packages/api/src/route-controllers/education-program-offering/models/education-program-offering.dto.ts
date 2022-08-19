import {
  OfferingTypes,
  OfferingStatus,
  NOTE_DESCRIPTION_MAX_LENGTH,
} from "../../../database/entities";
import { OfferingIntensity } from "../../../database/entities/offering-intensity.type";
import { EducationProgramOffering } from "../../../database/entities/education-program-offering.model";
import { getUserFullName } from "../../../utilities";
import {
  Allow,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";

export class StudyBreakOutDTO {
  breakStartDate: Date;
  breakEndDate: Date;
}

export class StudyBreakInDTO {
  @Allow()
  breakStartDate: Date;
  @Allow()
  breakEndDate: Date;
}

export interface StudyBreaksAndWeeksOutDTO {
  studyBreaks: StudyBreakOutDTO[];
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

export class EducationProgramOfferingAPIInDTO {
  @Allow()
  offeringName: string;
  @Allow()
  studyStartDate: Date;
  @Allow()
  studyEndDate: Date;
  @Allow()
  actualTuitionCosts: number;
  @Allow()
  programRelatedCosts: number;
  @Allow()
  mandatoryFees: number;
  @Allow()
  exceptionalExpenses: number;
  @Allow()
  offeringDelivered: string;
  @Allow()
  lacksStudyBreaks: boolean;
  @Allow()
  offeringIntensity: OfferingIntensity;
  @Allow()
  yearOfStudy: number;
  @Allow()
  hasOfferingWILComponent: string;
  @Allow()
  offeringDeclaration: boolean;
  @Allow()
  offeringStatus: OfferingStatus;
  @Allow()
  offeringType: OfferingTypes;
  @IsOptional()
  offeringWILType?: string;
  @IsOptional()
  showYearOfStudy?: boolean;
  @IsOptional()
  breaksAndWeeks?: StudyBreaksAndWeeksInDTO;
  @IsOptional()
  assessedBy?: string;
  @IsOptional()
  assessedDate?: Date;
  @IsOptional()
  courseLoad?: number;
}

export class EducationProgramOfferingAPIOutDTO {
  id: number;
  offeringName: string;
  studyStartDate: Date;
  studyEndDate: Date;
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
  offeringWILType?: string;
  showYearOfStudy?: boolean;
  breaksAndWeeks?: StudyBreaksAndWeeksInDTO;
  assessedBy?: string;
  assessedDate?: Date;
  submittedDate: Date;
  courseLoad?: number;
  hasExistingApplication?: boolean;
  locationName?: string;
  institutionName?: string;
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

/**
 * Summary DTO of program offering.
 */
export class EducationProgramOfferingDto {
  id: number;
  offeringName: string;
  studyDates: string;
  offeringDelivered: string;
  offeringIntensity: OfferingIntensity;
}

/**
 * View only DTO for program offering.
 */
export interface ProgramOfferingDto {
  id: number;
  offeringName: string;
  studyStartDate: Date;
  studyEndDate: Date;
  actualTuitionCosts: number;
  programRelatedCosts: number;
  mandatoryFees: number;
  exceptionalExpenses: number;
  offeringDelivered: string;
  lacksStudyBreaks: boolean;
  offeringIntensity: OfferingIntensity;
  yearOfStudy: number;
  showYearOfStudy?: boolean;
  hasOfferingWILComponent: string;
  offeringWILType?: string;
  breaksAndWeeks: StudyBreaksAndWeeksOutDTO;
  offeringDeclaration: boolean;
  assessedBy?: string;
  assessedDate?: Date;
  submittedDate: Date;
  offeringStatus: OfferingStatus;
  offeringType: OfferingTypes;
  locationName: string;
  institutionName: string;
  courseLoad?: number;
  hasExistingApplication?: boolean;
}

export class OfferingStartDateAPIOutDTO {
  studyStartDate: Date;
}

/**
 * Transformation util for Program Offering.
 * @param offering
 * @param hasExistingApplication is the offering linked to any application.
 * @returns ProgramOfferingDto
 */
export const transformToProgramOfferingDTO = (
  offering: EducationProgramOffering,
  hasExistingApplication?: boolean,
): EducationProgramOfferingAPIOutDTO => {
  return {
    id: offering.id,
    offeringName: offering.name,
    studyStartDate: offering.studyStartDate,
    studyEndDate: offering.studyEndDate,
    actualTuitionCosts: offering.actualTuitionCosts,
    programRelatedCosts: offering.programRelatedCosts,
    mandatoryFees: offering.mandatoryFees,
    exceptionalExpenses: offering.exceptionalExpenses,
    offeringDelivered: offering.offeringDelivered,
    lacksStudyBreaks: offering.lacksStudyBreaks,
    offeringIntensity: offering.offeringIntensity,
    yearOfStudy: offering.yearOfStudy,
    showYearOfStudy: offering.showYearOfStudy,
    hasOfferingWILComponent: offering.hasOfferingWILComponent,
    offeringWILType: offering.offeringWILType,
    breaksAndWeeks: offering.studyBreaks,
    offeringDeclaration: offering.offeringDeclaration,
    submittedDate: offering.submittedDate,
    offeringStatus: offering.offeringStatus,
    offeringType: offering.offeringType,
    locationName: offering.institutionLocation.name,
    institutionName: offering.institutionLocation.institution.operatingName,
    assessedBy: getUserFullName(offering.assessedBy),
    assessedDate: offering.assessedDate,
    courseLoad: offering.courseLoad,
    hasExistingApplication,
  };
};

export class OfferingAssessmentAPIInDTO {
  @IsEnum(OfferingStatus)
  offeringStatus: OfferingStatus;
  @IsNotEmpty()
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
