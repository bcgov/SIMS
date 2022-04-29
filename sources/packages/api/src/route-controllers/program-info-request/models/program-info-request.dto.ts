import { IsNotEmpty, IsInt, Min, IsOptional } from "class-validator";
import { SaveOfferingDTO } from "../../education-program-offering/models/education-program-offering.dto";
import { ProgramInfoStatus } from "../../../database/entities";
import { OfferingIntensity } from "../../../database/entities/offering-intensity.type";

export interface CompleteProgramInfoRequestDto extends SaveOfferingDTO {
  selectedProgram?: number;
  selectedOffering?: number;
}

export interface GetProgramInfoRequestDto
  extends CompleteProgramInfoRequestDto {
  institutionLocationName: string;
  applicationNumber: string;
  studentFullName: string;
  studentStudyStartDate: string;
  studentStudyEndDate: string;
  studentSelectedProgram: string;
  studentCustomProgram: string;
  studentCustomProgramDescription: string;
  pirStatus: ProgramInfoStatus;
  programYearId: number;
  pirDenyReasonId?: number;
  otherReasonDesc?: string;
  isActiveProgramYear: boolean;
  offeringIntensitySelectedByStudent: OfferingIntensity;
  programYearStartDate: Date;
  programYearEndDate: Date;
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
