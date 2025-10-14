import {
  ApplicationExceptionRequestStatus,
  ApplicationExceptionStatus,
} from "@/types";
import { Expose, Type } from "class-transformer";

export interface ApplicationExceptionRequestAPIInDTO {
  exceptionName: string;
}

export interface CreateApplicationExceptionAPIInDTO {
  applicationId: number;
  exceptionRequests: ApplicationExceptionRequestAPIInDTO[];
}

class AssessedExceptionRequestAPIInDTO {
  @Expose()
  exceptionRequestId: number;
  @Expose()
  exceptionRequestStatus:
    | ApplicationExceptionRequestStatus.Approved
    | ApplicationExceptionRequestStatus.Declined;
}

export class UpdateApplicationExceptionAPIInDTO {
  @Expose()
  @Type(() => AssessedExceptionRequestAPIInDTO)
  assessedExceptionRequests: AssessedExceptionRequestAPIInDTO[];
  @Expose()
  noteDescription: string;
}

export interface ApplicationExceptionRequestAPIOutDTO {
  exceptionRequestId: number;
  exceptionName: string;
  exceptionDescription: string;
  exceptionRequestStatus: ApplicationExceptionRequestStatus;
  previouslyApprovedOn?: Date;
}

export interface ApplicationExceptionAPIOutDTO {
  exceptionStatus: ApplicationExceptionStatus;
  submittedDate: Date;
  exceptionRequests: ApplicationExceptionRequestAPIOutDTO[];
}

export interface DetailedApplicationExceptionAPIOutDTO
  extends ApplicationExceptionAPIOutDTO {
  noteDescription: string;
  assessedByUserName: string;
  assessedDate: Date;
}

export interface ApplicationExceptionSummaryAPIOutDTO {
  applicationId: number;
  studentId: number;
  submittedDate: Date;
  givenNames?: string;
  lastName: string;
  applicationNumber: string;
}
