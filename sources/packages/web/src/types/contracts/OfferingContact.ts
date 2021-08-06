/**
 * Valid Intensity of the Offerings.
 */
export enum ValidIntensity {
  /**
   * Program with ProgramIntensity = partTime, will be Part Time
   */
  partTime = "partTime",
  /**
   *  Program with ProgramIntensity = fullTime, will be Full Time
   */
  fullTime = "fullTime",
}

export interface OfferingDTO {
  name: string;
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
  validIntensity: ValidIntensity;
}
