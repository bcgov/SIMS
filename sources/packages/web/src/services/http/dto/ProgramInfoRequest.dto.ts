import {
  CourseDetails,
  OfferingIntensity,
  OfferingTypes,
  ProgramInfoStatus,
} from "@/types";

export interface CompleteProgramInfoRequestAPIInDTO {
  selectedOffering: number;
}

export interface ProgramInfoRequestAPIOutDTO {
  institutionLocationName: string;
  applicationNumber: string;
  studentFullName: string;
  studentSelectedProgram: string;
  selectedProgram?: number;
  selectedOffering?: number;
  pirStatus: ProgramInfoStatus;
  studentCustomProgram: string;
  studentCustomProgramDescription: string;
  studentStudyStartDate: string;
  studentStudyEndDate: string;
  offeringIntensitySelectedByStudent: OfferingIntensity;
  programYearId: number;
  isActiveProgramYear: boolean;
  offeringName: string;
  offeringDelivered: string;
  offeringType: OfferingTypes;
  offeringIntensity: OfferingIntensity;
  courseDetails?: CourseDetails[];
  pirDenyReasonId?: number;
  otherReasonDesc?: string;
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
