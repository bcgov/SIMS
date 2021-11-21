import { OfferingDTO } from "@/types";

/**
 * Possible status for a Program Information Request (PIR).
 */
export enum ProgramInfoStatus {
  /**
   * The PIR must happen to an offering id
   * be provided by the institution.
   */
  required = "Required",
  /**
   * The offering id is present and no action
   * from institution is needed.
   */
  notRequired = "Not Required",
  /**
   * The PIR was completed by the institution.
   */
  submitted = "Submitted",
  /**
   * The PIR was previously required and it is now
   * populated with an offering id.
   */
  completed = "Completed",
  /**
   * The PIR was declined by the institution.
   */
  declined = "Declined",
}
export interface PIRSummaryDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationId: number;
  pirStatus: ProgramInfoStatus;
  fullName: string;
}

export interface CompleteProgramInfoRequestDto extends OfferingDTO {
  selectedProgram?: number;
  selectedOffering?: number;
  offeringType?: string;
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
  pirStatus: ProgramInfoStatus;
  programYearId: number;
}

export interface GetPIRDeniedReasonDto {
  id: number;
  description: string;
}

export interface DenyProgramInfoRequestDto {
  pirDenyReasonId: number;
  otherReasonDesc?: string;
}
