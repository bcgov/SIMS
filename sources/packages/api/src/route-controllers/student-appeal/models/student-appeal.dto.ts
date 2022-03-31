import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from "class-validator";
import { StudentAppealStatus } from "../../../database/entities";
/**
 * DTO for student appeal request.
 */
export class StudentAppealRequestDTO {
  @IsNotEmpty()
  formName: string;
  @IsDefined()
  formData: any;
}

/**
 * DTO for student appeal.
 */
export class StudentAppealDTO {
  @IsOptional()
  @IsNumber()
  applicationId?: number;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StudentAppealRequestDTO)
  studentAppealRequests: StudentAppealRequestDTO[];
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
