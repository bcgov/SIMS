import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsPositive,
  ValidateNested,
} from "class-validator";
import { StudentAppealStatus } from "../../../database/entities";
/**
 * DTO for student appeal request.
 */
export class StudentAppealRequestAPIInDTO {
  @IsNotEmpty()
  formName: string;
  @IsDefined()
  formData: any;
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
  submittedData: any;
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
