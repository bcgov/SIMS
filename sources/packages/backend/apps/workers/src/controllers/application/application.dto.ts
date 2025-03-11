import {
  APPLICATION_EDIT_STATUS,
  APPLICATION_EXCEPTION_STATUS,
  APPLICATION_ID,
  APPLICATION_STATUS,
} from "@sims/services/workflow/variables/assessment-gateway";
import {
  ApplicationEditStatus,
  ApplicationExceptionStatus,
  ApplicationStatus,
} from "@sims/sims-db";

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

export interface ApplicationChangeRequestApprovalJobInDTO {
  [APPLICATION_ID]: number;
}

export interface ApplicationChangeRequestApprovalJobOutDTO {
  [APPLICATION_EDIT_STATUS]: ApplicationEditStatus;
  [APPLICATION_STATUS]?: ApplicationStatus;
}
