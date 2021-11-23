import { OfferingTypes } from "../../../database/entities";
import { OfferingIntensity } from "../../../database/entities/offering-intensity.type";
import { StudyBreak } from "../../../database/entities/education-program-offering.model";

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
