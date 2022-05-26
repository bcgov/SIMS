import { OfferingTypes, OfferingStatus } from "../../../database/entities";
import { OfferingIntensity } from "../../../database/entities/offering-intensity.type";
import {
  EducationProgramOffering,
  StudyBreak,
} from "../../../database/entities/education-program-offering.model";
import { getUserFullName } from "../../../utilities";
import { IsEnum, IsNotEmpty } from "class-validator";

export interface SaveOfferingDTO {
  offeringName: string;
  studyStartDate: Date;
  studyEndDate: Date;
  actualTuitionCosts: number;
  programRelatedCosts: number;
  mandatoryFees: number;
  exceptionalExpenses: number;
  tuitionRemittanceRequestedAmount: number;
  offeringDelivered: string;
  lacksStudyBreaks: boolean;
  tuitionRemittanceRequested: string;
  offeringIntensity: OfferingIntensity;
  yearOfStudy: number;
  showYearOfStudy?: boolean;
  hasOfferingWILComponent: string;
  offeringWILType?: string;
  studyBreaks?: StudyBreak[];
  offeringDeclaration: boolean;
  assessedBy?: string;
  assessedDate?: Date;
  offeringStatus: OfferingStatus;
  offeringType: OfferingTypes;
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
  tuitionRemittanceRequestedAmount: number;
  offeringDelivered: string;
  lacksStudyBreaks: boolean;
  tuitionRemittanceRequested: string;
  offeringIntensity: OfferingIntensity;
  yearOfStudy: number;
  showYearOfStudy?: boolean;
  hasOfferingWILComponent: string;
  offeringWILType?: string;
  studyBreaks?: StudyBreak[];
  offeringDeclaration: boolean;
  assessedBy?: string;
  assessedDate?: Date;
  submittedDate: Date;
  offeringStatus: OfferingStatus;
  offeringType: OfferingTypes;
  locationName: string;
  institutionName: string;
  courseLoad?: number;
}

export interface ProgramOfferingDetailsDto {
  studyStartDate?: Date;
}

/**
 * Transformation util for Program Offering.
 * @param offering
 * @returns ProgramOfferingDto
 */
export const transformToProgramOfferingDto = (
  offering: EducationProgramOffering,
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
    tuitionRemittanceRequestedAmount: offering.tuitionRemittanceRequestedAmount,
    offeringDelivered: offering.offeringDelivered,
    lacksStudyBreaks: offering.lacksStudyBreaks,
    tuitionRemittanceRequested: offering.tuitionRemittanceRequested,
    offeringIntensity: offering.offeringIntensity,
    yearOfStudy: offering.yearOfStudy,
    showYearOfStudy: offering.showYearOfStudy,
    hasOfferingWILComponent: offering.hasOfferingWILComponent,
    offeringWILType: offering.offeringWILType,
    studyBreaks: offering.studyBreaks,
    offeringDeclaration: offering.offeringDeclaration,
    submittedDate: offering.submittedDate,
    offeringStatus: offering.offeringStatus,
    offeringType: offering.offeringType,
    locationName: offering.institutionLocation.name,
    institutionName: offering.institutionLocation.institution.operatingName,
    assessedBy: getUserFullName(offering.assessedBy),
    assessedDate: offering.assessedDate,
    courseLoad: offering.courseLoad,
  };
};

export class OfferingAssessmentAPIInDTO {
  @IsEnum(OfferingStatus)
  offeringStatus: OfferingStatus;
  @IsNotEmpty()
  assessmentNotes: string;
}
