import { IsEnum, IsInt, IsNotEmpty, IsOptional, Min } from "class-validator";

import {
  ProgramInfoStatus,
  AssessmentStatus,
  COEStatus,
  ApplicationStatus,
  SupportingUserType,
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

export class UpdateApplicationStatusWorkflowIdDto extends UpdateApplicationStatusDto {
  @IsNotEmpty()
  workflowId: string;
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
