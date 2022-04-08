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
export class StudentAppealRequestApiInDTO {
  @IsNotEmpty()
  formName: string;
  @IsDefined()
  formData: any;
}

/**
 * DTO for student appeal.
 */
export class StudentAppealApiInDTO {
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StudentAppealRequestApiInDTO)
  studentAppealRequests: StudentAppealRequestApiInDTO[];
}

export class StudentAppealRequestApiOutDTO {
  id: number;
  submittedData: any;
  submittedFormName: string;
  appealStatus: StudentAppealStatus;
  assessedDate?: Date;
  assessedByUserName?: string;
  noteDescription?: string;
}

export class StudentAppealApiOutDTO {
  id: number;
  submittedDate: Date;
  status: StudentAppealStatus;
  appealRequests: StudentAppealRequestApiOutDTO[];
}

export class StudentAppealRequestApprovalApiInDTO {
  @IsPositive()
  id: number;
  @IsEnum(StudentAppealStatus)
  appealStatus: StudentAppealStatus;
  @IsNotEmpty()
  noteDescription: string;
}

export class StudentAppealApprovalApiInDTO {
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StudentAppealRequestApprovalApiInDTO)
  requests: StudentAppealRequestApprovalApiInDTO[];
}
