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
