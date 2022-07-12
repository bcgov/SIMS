import {
  IsNotEmpty,
  IsInt,
  Min,
  IsOptional,
  IsPositive,
} from "class-validator";
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

export interface GetPIRDeniedReasonDto {
  id: number;
  description: string;
}

export class DenyProgramInfoRequestDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  pirDenyReasonId: number;
  @IsOptional()
  otherReasonDesc?: string;
}
