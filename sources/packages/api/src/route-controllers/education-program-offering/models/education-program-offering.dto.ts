import {
  OfferingTypes,
  OfferingStatus,
  NOTE_DESCRIPTION_MAX_LENGTH,
} from "../../../database/entities";
import { OfferingIntensity } from "../../../database/entities/offering-intensity.type";
import {
  EducationProgramOffering,
  StudyBreaksAndWeeks,
} from "../../../database/entities/education-program-offering.model";
import { getUserFullName } from "../../../utilities";
import { IsEnum, IsIn, IsNotEmpty, MaxLength } from "class-validator";

export interface SaveOfferingDTO {
  offeringName: string; // ok
  studyStartDate: Date; // ok
  studyEndDate: Date; // ok
  actualTuitionCosts: number; //ok
  programRelatedCosts: number; // ok
  mandatoryFees: number; // ok
  exceptionalExpenses: number; // ok
  offeringDelivered: string; // ok
  lacksStudyBreaks: boolean; // ok
  offeringIntensity: OfferingIntensity; // ok
  yearOfStudy: number; // ok
  showYearOfStudy?: boolean; // ok
  hasOfferingWILComponent: string; // ok - hasWILComponent
  offeringWILType?: string;
  studyBreaks?: StudyBreaksAndWeeks; // ok - complex
  offeringDeclaration: boolean;
  assessedBy?: string; // NOPE
  assessedDate?: Date; // NOPE
  offeringStatus: OfferingStatus; // ok
  offeringType: OfferingTypes; // ok
  courseLoad?: number;
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
  breaksAndWeeks: StudyBreaksAndWeeks;
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

export interface ProgramOfferingDetailsDto {
  studyStartDate?: Date;
}

/**
 * Transformation util for Program Offering.
 * @param offering
 * @param hasExistingApplication is the offering linked to any application.
 * @returns ProgramOfferingDto
 */
export const transformToProgramOfferingDto = (
  offering: EducationProgramOffering,
  hasExistingApplication?: boolean,
): ProgramOfferingDto => {
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
