import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsDefined,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsPositive,
  ValidateNested,
} from "class-validator";
import { StudentAppealStatus } from "@sims/sims-db";
import { JsonMaxSize } from "../../../utilities/class-validation";
import { JSON_10KB } from "../../../constants";
import {
  CHANGE_REQUEST_APPEAL_FORMS,
  STUDENT_APPEAL_FORM_NAMES,
  STUDENT_APPLICATION_APPEAL_FORM_NAMES,
} from "../../../services";

/**
 * Shared validations for appeal requests.
 */
export class AppealRequestAPIInDTO {
  @IsDefined()
  @JsonMaxSize(JSON_10KB)
  formData: unknown;
  @IsDefined()
  files: string[];
}

/**
 * Student-only appeal request.
 */
export class StudentAppealAPIInDTO extends AppealRequestAPIInDTO {
  @IsIn(STUDENT_APPEAL_FORM_NAMES)
  formName: string;
}

/**
 * Student application appeal request.
 */
export class ApplicationAppealRequestAPIInDTO extends AppealRequestAPIInDTO {
  @IsIn([
    ...STUDENT_APPLICATION_APPEAL_FORM_NAMES,
    ...CHANGE_REQUEST_APPEAL_FORMS,
  ])
  formName: string;
}

/**
 * Student application appeal.
 */
export class StudentApplicationAppealAPIInDTO {
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ApplicationAppealRequestAPIInDTO)
  studentAppealRequests: ApplicationAppealRequestAPIInDTO[];
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

export class AppealSummaryAPIOutDTO {
  id: number;
  appealStatus: StudentAppealStatus;
  appealRequestNames: string[];
  applicationId?: number;
  applicationNumber?: string;
  assessedDate?: Date;
}

export class StudentAppealSummaryAPIOutDTO {
  appeals: AppealSummaryAPIOutDTO[];
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
