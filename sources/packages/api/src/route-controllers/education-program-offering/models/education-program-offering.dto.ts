import { OfferingTypes, OfferingStatus } from "../../../database/entities";
import { OfferingIntensity } from "../../../database/entities/offering-intensity.type";
import { StudyBreak } from "../../../database/entities/education-program-offering.model";
import { ProgramOfferingModel } from "../../../services/education-program-offering/education-program-offering.service.models";

export interface ProgramOfferingBaseDTO {
  offeringName: string;
  studyStartDate: Date;
  studyEndDate: Date;
  actualTuitionCosts: number;
  programRelatedCosts: number;
  mandatoryFees: number;
  exceptionalExpenses: number;
  tuitionRemittanceRequestedAmount: number;
  offeringDelivered: string;
  lacksStudyDates: boolean;
  lacksStudyBreaks: boolean;
  lacksFixedCosts: boolean;
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
}
/**
 * DTO for persisting program offering.
 */
export interface SaveEducationProgramOfferingDto
  extends ProgramOfferingBaseDTO {
  offeringType?: OfferingTypes;
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
export interface ProgramOfferingDto extends ProgramOfferingBaseDTO {
  id: number;
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
  offering: ProgramOfferingModel,
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
    lacksStudyDates: offering.lacksStudyDates,
    lacksStudyBreaks: offering.lacksStudyBreaks,
    lacksFixedCosts: offering.lacksFixedCosts,
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
  };
};
