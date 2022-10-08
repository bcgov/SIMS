import { ApplicationExceptionStatus, ApplicationStatus } from "@sims/sims-db";

export class ApplicationUpdateStatusWorkersInDTO {
  applicationId: number;
}

export class ApplicationUpdateStatusHeadersDTO {
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
}

export class ApplicationExceptionsWorkersInDTO {
  applicationId: number;
}

export class ApplicationExceptionsWorkersOutDTO {
  applicationExceptionStatus: ApplicationExceptionStatus;
}
