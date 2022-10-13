import { ApplicationExceptionStatus, ApplicationStatus } from "@sims/sims-db";

export interface ApplicationUpdateStatusJobInDTO {
  applicationId: number;
}

export interface ApplicationUpdateStatusJobHeaderDTO {
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
}

export interface ApplicationExceptionsJobInDTO {
  applicationId: number;
}

export interface ApplicationExceptionsJobOutDTO {
  applicationExceptionStatus: ApplicationExceptionStatus;
}
