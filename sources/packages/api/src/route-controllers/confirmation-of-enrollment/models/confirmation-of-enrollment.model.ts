export interface ApplicationDetailsForCOEDTO {
  applicationProgramName: string;
  applicationProgramDescription: string;
  applicationOfferingName: string;
  applicationOfferingIntensity: string;
  applicationOfferingStartDate: string;
  applicationOfferingEndDate: string;
  applicationOfferingHasStudyBreak: boolean;
  applicationOfferingBreakStartDate: string;
  applicationOfferingBreakEndDate: string;
  applicationOfferingActualTuition: number;
  applicationOfferingProgramRelatedCost: number;
  applicationOfferingMandatoryCost: number;
  applicationOfferingExceptionalExpenses: number;
  applicationOfferingHasTuitionRemittanceRequested: string;
  applicationOfferingTuitionRemittanceAmount: number;
  applicationOfferingStudyDelivered: string;
  applicationStudentName: string;
  applicationNumber: string;
  applicationLocationName: string;
  applicationStatus: string;
  applicationCOEStatus: string;
  applicationId: number;
  applicationWithinCOEWindow: boolean;
  applicationLocationId: number;
}
