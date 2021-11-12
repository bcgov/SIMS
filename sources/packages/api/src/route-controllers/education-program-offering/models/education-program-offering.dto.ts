import { OfferingTypes } from "../../../database/entities";
import { OfferingIntensity } from "../../../database/entities/offering-intensity.type";
/**
 * DTO for persisting program offering.
 */
export interface SaveEducationProgramOfferingDto {
  offeringName: string;
  studyStartDate: Date;
  studyEndDate: Date;
  breakStartDate: Date;
  breakEndDate: Date;
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
  offeringType?: OfferingTypes;
  offeringIntensity: OfferingIntensity;
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
  breakStartDate: Date;
  breakEndDate: Date;
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
}

export interface ProgramOfferingDetailsDto {
  studyStartDate?: Date;
}
