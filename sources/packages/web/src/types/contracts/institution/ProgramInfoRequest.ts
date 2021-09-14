import { SaveEducationProgramOfferingDto } from "@/types";

export interface PIRSummaryDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationId: number;
  pirStatus: string;
  fullName: string;
}

export interface CompleteProgramInfoRequestDto
  extends SaveEducationProgramOfferingDto {
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
  pirStatus: string;
}

export interface GetPIRDeniedReasonDto {
  id: number;
  description: string;
}

export interface DenyProgramInfoRequestDto {
  pirDenyReasonId: number;
  otherReasonDesc?: string;
}
