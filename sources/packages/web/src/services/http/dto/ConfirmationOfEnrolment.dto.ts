import { COEStatus, ProgramInfoStatus, StudyBreakCOE } from "@/types";

export interface ConfirmationOfEnrollmentAPIInDTO {
  tuitionRemittanceAmount: number;
}

export interface COESummaryAPIOutDTO {
  applicationNumber: string;
  studyStartPeriod: Date;
  studyEndPeriod: Date;
  applicationId: number;
  coeStatus: COEStatus;
  fullName: string;
  disbursementScheduleId: number;
  disbursementDate: Date;
}

export interface ApplicationDetailsForCOEAPIOutDTO {
  applicationProgramName: string;
  applicationProgramDescription: string;
  applicationOfferingName: string;
  applicationOfferingIntensity: string;
  applicationOfferingStartDate: string;
  applicationOfferingEndDate: string;
  applicationOfferingHasStudyBreak: boolean;
  applicationOfferingActualTuition: number;
  applicationOfferingProgramRelatedCost: number;
  applicationOfferingMandatoryCost: number;
  applicationOfferingExceptionalExpenses: number;
  applicationOfferingStudyDelivered: string;
  applicationStudentName: string;
  applicationNumber: string;
  applicationLocationName: string;
  applicationStatus: string;
  applicationCOEStatus: COEStatus;
  applicationId: number;
  applicationWithinCOEWindow: boolean;
  applicationLocationId: number;
  applicationDeniedReason?: string;
  studyBreaks?: StudyBreakCOE[];
  applicationPIRStatus: ProgramInfoStatus;
  disbursementDate: string;
  applicationProgramCredential: string;
  applicationProgramDelivery: string;
}

export interface COEDeniedReasonAPIOutDTO {
  value: number;
  label: string;
}

export interface DenyConfirmationOfEnrollmentAPIInDTO {
  coeDenyReasonId: number;
  otherReasonDesc?: string;
}
