import {
  IsNotEmpty,
  IsInt,
  Min,
  IsOptional,
  IsPositive,
} from "class-validator";
import { SaveOfferingDTO } from "src/route-controllers/education-program-offering/models/education-program-offering.dto";
import { ProgramInfoStatus } from "../../../database/entities";
import { OfferingIntensity } from "../../../database/entities/offering-intensity.type";

export class CompleteProgramInfoRequestAPIInDTO {
  @IsPositive()
  selectedOffering: number;
}

export interface GetProgramInfoRequestDto extends SaveOfferingDTO {
  selectedOffering?: number;
  selectedProgram?: number;
  offeringName: string;
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
