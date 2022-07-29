import { IsOptional, IsPositive } from "class-validator";
import { OfferingTypes, ProgramInfoStatus } from "../../../database/entities";
import { OfferingIntensity } from "../../../database/entities/offering-intensity.type";

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
  isActiveProgramYear: boolean;
  offeringName: string;
  offeringDelivered: string;
  offeringType: OfferingTypes;
  offeringIntensity: OfferingIntensity;
  courseDetails?: CourseDetails[];
  pirDenyReasonId?: number;
  otherReasonDesc?: string;
}

export class CourseDetails {
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
