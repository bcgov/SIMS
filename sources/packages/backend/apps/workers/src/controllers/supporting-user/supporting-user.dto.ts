import { APPLICATION_ID } from "@sims/services/workflow/variables/assessment-gateway";
import {
  CREATED_SUPPORTING_USER_ID,
  FULL_NAME_PROPERTY_FILTER,
  IS_ABLE_TO_REPORT,
  SUPPORTING_USER_TYPE,
} from "@sims/services/workflow/variables/supporting-user-information-request";
import { SupportingUserType } from "@sims/sims-db";

export interface CreateSupportingUsersJobInDTO {
  applicationId: number;
  supportingUsersTypes: SupportingUserType[];
}

export interface CreateSupportingUsersJobOutDTO {
  createdSupportingUsersIds: number[];
}

export interface CheckSupportingUserResponseJobInDTO {
  supportingUserId: number;
}

export interface CreateIdentifiableSupportingUsersJobInDTO {
  [APPLICATION_ID]: number;
  [SUPPORTING_USER_TYPE]: SupportingUserType;
  [FULL_NAME_PROPERTY_FILTER]?: string;
  [IS_ABLE_TO_REPORT]: boolean;
}

export interface CreateIdentifiableSupportingUsersJobOutDTO {
  [CREATED_SUPPORTING_USER_ID]: number;
}
