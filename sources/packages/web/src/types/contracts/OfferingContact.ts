export interface Offering {
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
}
