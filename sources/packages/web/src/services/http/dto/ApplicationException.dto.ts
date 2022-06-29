import { ApplicationExceptionStatus } from "@/types";

export interface ApplicationExceptionRequestAPIInDTO {
  exceptionName: string;
}

export interface CreateApplicationExceptionAPIInDTO {
  applicationId: number;
  exceptionRequests: ApplicationExceptionRequestAPIInDTO[];
}

export interface UpdateApplicationExceptionAPIInDTO {
  exceptionStatus: ApplicationExceptionStatus;
  noteDescription: string;
}

export interface ApplicationExceptionRequestAPIOutDTO {
  exceptionName: string;
}

export interface ApplicationExceptionAPIOutDTO {
  exceptionStatus: ApplicationExceptionStatus;
  submittedDate: Date;
  noteDescription: string;
  assessedByUserName?: string;
  assessedDate?: Date;
  exceptionRequests: ApplicationExceptionRequestAPIOutDTO[];
}

export interface ApplicationExceptionSummaryAPIOutDTO {
  applicationId: number;
  studentId: number;
  submittedDate: Date;
  fullName: string;
  applicationNumber: string;
}
