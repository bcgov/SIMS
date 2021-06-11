export interface CreateEducationProgramOfferingDto {
  name: string;
  studyStartDate: Date;
  studyEndDate: Date;
  breakStartDate: Date;
  breakEndDate: Date;
  actualTutionCosts: number;
  programRelatedCosts: number;
  mandatoryFees: number;
  exceptionalExpenses: number;
  amountRequested: number;
  offeringDelivered: string;
  lacksProgramDates: boolean;
  lacksStudyBreaks: boolean;
  lacksFixedCosts: boolean;
  tutionRemittanceRequested: string;
}
