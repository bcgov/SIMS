export interface CompleteProgramInfoRequestDto {
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
  lacksStudyBreaks: boolean;
  tuitionRemittanceRequested: string;
  selectedProgram?: number;
  selectedOffering?: number;
}

export interface GetProgramInfoRequestDto
  extends CompleteProgramInfoRequestDto {
  institutionLocationName: string;
  applicationNumber: string;
  studentFullName: string;
  studentSelectedProgram: string;
  studentCustomProgram: string;
  studentCustomProgramDescription: string;
  studentStudyStartDate: string;
  studentStudyEndDate: string;
}
