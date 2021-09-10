import { IsEnum, IsInt, IsNotEmpty, IsOptional, Min } from "class-validator";
import { OfferingIntensity } from "../../../database/entities/offering-intensity.type";

import {
  ProgramInfoStatus,
  AssessmentStatus,
  COEStatus,
  ApplicationStatus,
} from "../../../database/entities";

export class UpdateProgramInfoDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  programId?: number;
  @IsOptional()
  @IsInt()
  @Min(1)
  offeringId?: number;
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  locationId: number;
  @IsEnum(ProgramInfoStatus)
  status: ProgramInfoStatus;
}

export class UpdateProgramInfoStatusDto {
  @IsEnum(ProgramInfoStatus)
  status: ProgramInfoStatus;
}

export class UpdateAssessmentStatusDto {
  @IsEnum(AssessmentStatus)
  status: AssessmentStatus;
}

export class UpdateCOEStatusDto {
  @IsEnum(COEStatus)
  status: COEStatus;
}

export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;
}

export interface ProgramOfferingDto {
  id: number;
  studyStartDate: Date;
  studyEndDate: Date;
  breakStartDate: Date;
  breakEndDate: Date;
  actualTuitionCosts: number;
  programRelatedCosts: number;
  mandatoryFees: number;
  exceptionalExpenses: number;
  tuitionRemittanceRequestedAmount: number;
  offeringDelivered: string;
  offeringIntensity: OfferingIntensity;
  programCredentialType: string;
  programLength: string;
  institutionType: string;
  institutionLocationProvince: string;
  studentPDStatus: boolean;
}
