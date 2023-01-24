import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  ValidateNested,
} from "class-validator";
import { StudentAppealStatus } from "@sims/sims-db";

/**
 * DTO for student appeal request.
 */
export class StudentAppealRequestAPIInDTO {
  @IsNotEmpty()
  formName: string;
  @IsDefined()
  formData: StudentIncomeAppealRequest | PartnerIncomeAppealRequest;
}

export class StudentIncomeAppealRequest {
  @IsNumber()
  @IsPositive()
  studentNewIncome: number;
}

export class PartnerIncomeAppealRequest {
  @IsNumber()
  @IsPositive()
  partnerNewIncome: number;
}

/**
 * DTO for student appeal.
 */
export class StudentAppealAPIInDTO {
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StudentAppealRequestAPIInDTO)
  studentAppealRequests: StudentAppealRequestAPIInDTO[];
}

export class StudentAppealRequestAPIOutDTO {
  id: number;
  submittedData: unknown;
  submittedFormName: string;
  appealStatus: StudentAppealStatus;
  assessedDate?: Date;
  assessedByUserName?: string;
  noteDescription?: string;
}

export class StudentAppealAPIOutDTO {
  id: number;
  submittedDate: Date;
  status: StudentAppealStatus;
  appealRequests: StudentAppealRequestAPIOutDTO[];
}

export class StudentAppealRequestApprovalAPIInDTO {
  @IsPositive()
  id: number;
  @IsEnum(StudentAppealStatus)
  appealStatus: StudentAppealStatus;
  @IsNotEmpty()
  noteDescription: string;
}

export class StudentAppealApprovalAPIInDTO {
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StudentAppealRequestApprovalAPIInDTO)
  requests: StudentAppealRequestApprovalAPIInDTO[];
}

export class StudentAppealPendingSummaryAPIOutDTO {
  appealId: number;
  applicationId: number;
  studentId: number;
  submittedDate: Date;
  fullName: string;
  applicationNumber: string;
}
