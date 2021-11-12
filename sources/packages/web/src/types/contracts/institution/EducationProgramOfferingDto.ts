import { OfferingIntensity } from "@/types/contracts/OfferingContact";
export interface SaveEducationProgramOfferingDto {
  name: string;
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
  offeringType?: string;
}
/**
 * Program offering summary DTO for Vue.
 */
export interface EducationProgramOfferingDto {
  id: number;
  offeringName: string;
  studyDates: string;
  offeringDelivered: string;
  offeringIntensity: OfferingIntensity;
}
