import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsDefined,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsPositive,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { StudentAppealStatus } from "@sims/sims-db";
import { JsonMaxSize } from "../../../utilities/class-validation";
import { FORM_NAME_MAX_LENGTH, JSON_10KB } from "../../../constants";
import { FormNames } from "../../../services";

export interface AppealRequestAPIInDTO {
  formName: string;
  formData: unknown;
  files: string[];
}

export class StudentAppealAPIInDTO implements AppealRequestAPIInDTO {
  @IsIn([FormNames.ModifiedIndependentAppeal])
  formName: string;
  @IsDefined()
  @JsonMaxSize(JSON_10KB)
  formData: unknown;
  @IsDefined()
  files: string[];
}

/**
 * DTO for student appeal request.
 */
export class StudentAppealRequestAPIInDTO implements AppealRequestAPIInDTO {
  @IsNotEmpty()
  @MaxLength(FORM_NAME_MAX_LENGTH)
  formName: string;
  @IsDefined()
  @JsonMaxSize(JSON_10KB)
  formData: unknown;
  @IsDefined()
  files: string[];
}

/**
 * Student application appeal.
 */
export class StudentApplicationAppealAPIInDTO {
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => StudentAppealRequestAPIInDTO)
  studentAppealRequests: StudentAppealRequestAPIInDTO[];
}

export class StudentAppealRequestAPIOutDTO {
  id: number;
  submittedData: unknown;
  submittedFormName: string;
  appealStatus: StudentAppealStatus;
}

export class DetailedStudentAppealRequestAPIOutDTO extends StudentAppealRequestAPIOutDTO {
  assessedDate?: Date;
  assessedByUserName?: string;
  noteDescription?: string;
}

export class StudentAppealAPIOutDTO<T> {
  id: number;
  submittedDate: Date;
  status: StudentAppealStatus;
  appealRequests: T[];
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
  applicationId?: number;
  applicationNumber?: string;
  studentId: number;
  submittedDate: Date;
  firstName?: string;
  lastName: string;
}

export class EligibleApplicationForAppealAPIOutDTO {
  id: number;
  applicationNumber: string;
}

export class EligibleApplicationsForAppealAPIOutDTO {
  applications: EligibleApplicationForAppealAPIOutDTO[];
}
