import { IsOptional, IsPositive } from "class-validator";
import {
  OfferingTypes,
  ProgramInfoStatus,
  OfferingIntensity,
} from "@sims/sims-db";

export class CompleteProgramInfoRequestAPIInDTO {
  @IsPositive()
  selectedOffering: number;
}

export class ProgramInfoRequestAPIOutDTO {
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
  isActiveProgram?: boolean;
  isExpiredProgram?: boolean;
  isActiveProgramYear: boolean;
  offeringName: string;
  offeringDelivered: string;
  offeringType: OfferingTypes;
  offeringIntensity: OfferingIntensity;
  courseDetails?: CourseDetailsAPIOutDTO[];
  pirDenyReasonId?: number;
  otherReasonDesc?: string;
}

export class CourseDetailsAPIOutDTO {
  courseName: string;
  courseCode: string;
  courseStartDate: string;
  courseEndDate: string;
}

export class PIRDeniedReasonAPIOutDTO {
  id: number;
  description: string;
}

export class PIRSummaryAPIOutDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationId: number;
  pirStatus: string;
  fullName: string;
}

export class DenyProgramInfoRequestAPIInDTO {
  @IsPositive()
  pirDenyReasonId: number;
  @IsOptional()
  otherReasonDesc?: string;
}
