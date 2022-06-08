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
  noteDescription: string;
  assessedByUserName?: string;
  assessedDate?: Date;
  exceptionRequests: ApplicationExceptionRequestAPIOutDTO[];
}
