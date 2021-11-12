/**
 * Valid Intensity of the Offerings.
 */
export enum OfferingIntensity {
  /**
   * Program with ProgramIntensity = partTime, will be Part Time
   */
  partTime = "Part Time",
  /**
   *  Program with ProgramIntensity = fullTime, will be Full Time
   */
  fullTime = "Full Time",
}

/**
 * DTO for program offering form object
 */
export interface OfferingDTO {
  offeringName: string;
  studyStartDate?: Date;
  studyEndDate?: Date;
  breakStartDate?: Date;
  breakEndDate?: Date;
  actualTuitionCosts?: number;
  programRelatedCosts?: number;
  mandatoryFees?: number;
  exceptionalExpenses?: number;
  tuitionRemittanceRequestedAmount?: number;
  offeringDelivered?: string;
  lacksStudyDates: boolean;
  lacksStudyBreaks: boolean;
  lacksFixedCosts: boolean;
  tuitionRemittanceRequested: string;
  offeringIntensity: OfferingIntensity;
}
export interface ProgramOfferingDetailsDto {
  studyStartDate?: Date;
}
