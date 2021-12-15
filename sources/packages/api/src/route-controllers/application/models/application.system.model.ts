import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from "class-validator";
import { DisbursementValueType } from "../../../database/entities/disbursement-value-type";

import {
  ProgramInfoStatus,
  AssessmentStatus,
  COEStatus,
  ApplicationStatus,
  SupportingUserType,
  OfferingIntensity,
} from "../../../database/entities";
import { Type } from "class-transformer";

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

export class UpdateApplicationStatusWorkflowIdDto extends UpdateApplicationStatusDto {
  @IsNotEmpty()
  workflowId: string;
}

export class UpdateOfferingIntensity extends UpdateApplicationStatusDto {
  @IsEnum(OfferingIntensity)
  offeringIntensity: OfferingIntensity;
}

export interface CRAVerificationIncomeDetailsDto {
  /**
   * Income manually reported by the Student in the Application.
   */
  reported: number;
  /**
   * If available, income returned from the CRA.
   */
  craReported?: number;
  /**
   * Indicates if the CRA verification is done.
   * Even after the CRA verification is executed the
   * value of the craReported can still be null,
   * for instance, when the person data is not valid or
   * when there is no tax filed for the requested year.
   */
  verifiedOnCRA: boolean;
}

export class CreateIncomeVerificationDto {
  @IsInt()
  @Min(2000)
  taxYear: number;
  @IsInt()
  @Min(0)
  reportedIncome: number;
  @IsOptional()
  @IsInt()
  @Min(1)
  supportingUserId?: number;
}

export class CreateSupportingUsersDto {
  @IsEnum(SupportingUserType)
  supportingUserType: SupportingUserType;
}

export interface SupportingUserDto {
  supportingData: any;
}

/**
 * Values to be associated with a disbursement.
 */
export class DisbursementValueDTO {
  @IsNotEmpty()
  valueCode: string;
  @IsEnum(DisbursementValueType)
  valueType: DisbursementValueType;
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  valueAmount: number;
}

/**
 * Disbursement to be created altogether
 * with its values on a Student Application.
 */
export class DisbursementScheduleDTO {
  @IsNotEmpty()
  disbursementDate: Date;
  @IsNotEmpty()
  negotiatedExpiryDate: Date;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DisbursementValueDTO)
  disbursements: DisbursementValueDTO[];
}

/**
 * Schedules to be created altogether
 * on a Student Application.
 */
export class CreateDisbursementsDTO {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DisbursementScheduleDTO)
  schedules: DisbursementScheduleDTO[];
}
