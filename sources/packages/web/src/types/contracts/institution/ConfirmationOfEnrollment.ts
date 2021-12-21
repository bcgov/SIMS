import { ProgramInfoStatus } from "@/types";

export interface COESummaryDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationId: number;
  coeStatus: string;
  fullName: string;
}

export interface ApplicationDetailsForCOEDTO {
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
  applicationOfferingHasTuitionRemittanceRequested: string;
  applicationOfferingTuitionRemittanceAmount: number;
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
}

/**
 * Possible status for Confirmation of Enrollment, when the Application_status is in Enrollment
 */
export enum COEStatus {
  /**
   * Confirmation of Enrollment is required
   */
  required = "Required",
  /**
   * Confiramtion of Enrollment is not required, not used in our current workflow but having it as an placeholder
   */
  notRequired = "Not Required",
  /**
   * Confirmation of Enrollment is Completed
   */
  completed = "Completed",
  /**
   * Confirmation of Enrollment is Declined,  not used in our current workflow but having it as an placeholder
   */
  declined = "Declined",
  /**
   * Confirmation of Enrollment is Submitted, when institution clicks confirm COE, first the application will move to Submitted status
   */
  submitted = "Submitted",
}

export interface COEDeniedReasonDto {
  value: number;
  label: string;
}

export interface DenyConfirmationOfEnrollment {
  coeDenyReasonId: number;
  otherReasonDesc?: string;
}

/**
 * Read only Dto for study break item.
 * This is for COE where study breaks are shown in read only view.
 */
export interface StudyBreakCOE {
  breakStartDate: string;
  breakEndDate: string;
}
