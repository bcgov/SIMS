import { OfferingDTO, OfferingIntensity, ProgramInfoStatus } from "@/types";

export interface ProgramInfoRequestAPIOutDTO
  extends CompleteProgramInfoRequestAPIInDTO {
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
  pirDenyReasonId?: number;
  otherReasonDesc?: string;
  // for `Deny program information request` checkbox
  denyProgramInformationRequest: boolean;
  isActiveProgramYear: boolean;
  offeringIntensitySelectedByStudent: OfferingIntensity;
  programYearStartDate: Date;
  programYearEndDate: Date;
}

export interface PIRSummaryDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationId: number;
  pirStatus: ProgramInfoStatus;
  fullName: string;
}

export interface CompleteProgramInfoRequestAPIInDTO extends OfferingDTO {
  selectedProgram?: number;
  selectedOffering?: number;
  offeringType?: string;
}

export interface PIRDeniedReasonAPIOutDTO {
  id: number;
  description: string;
}

export interface PIRSummaryAPIOutDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationId: number;
  pirStatus: string;
  fullName: string;
}

export interface DenyProgramInfoRequestAPIInDTO {
  pirDenyReasonId: number;
  otherReasonDesc?: string;
}
