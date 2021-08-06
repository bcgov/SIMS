import { SaveEducationProgramOfferingDto } from "@/types";

export interface PIRSummaryDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationNumberId: number;
  pirStatus: string;
  firstName: string;
  lastName: string;
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
