export interface PIRSummaryDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationNumberId: number;
  pirStatus: string;
  firstName: string;
  lastName: string;
}

export interface GetProgramInfoRequestDto {
  institutionLocationName: string;
  applicationNumber: string;
  studentFullName: string;
  studentSelectedProgram: string;
  studentCustomProgram: string;
  studentCustomProgramDescription: string;
  studentStudyStartDate: string;
  studentStudyEndDate: string;
  lacksStudyBreaks?: boolean;
  selectedProgram: number;
  selectedOffering?: number;
}
