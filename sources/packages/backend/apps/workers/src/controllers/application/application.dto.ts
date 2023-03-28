import {
  APPLICATION_EXCEPTION_STATUS,
  APPLICATION_ID,
  ASSESSMENT_ID,
} from "@sims/services/workflow/variables/assessment-gateway";
import { ApplicationExceptionStatus, ApplicationStatus } from "@sims/sims-db";

export interface ApplicationUpdateStatusJobInDTO {
  [APPLICATION_ID]: number;
}

export interface ApplicationUpdateStatusJobHeaderDTO {
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
}

export interface ApplicationExceptionsJobInDTO {
  [APPLICATION_ID]: number;
}

export interface ApplicationExceptionsJobOutDTO {
  [APPLICATION_EXCEPTION_STATUS]: ApplicationExceptionStatus;
}

export interface AssignMSFAAJobInDTO {
  [ASSESSMENT_ID]: number;
}
