import { SupportingUserType } from "@sims/sims-db";

export interface CreateIdentifiableSupportingUsersJobInDTO {
  applicationId: number;
  supportingUserType: SupportingUserType;
  fullNamePropertyFilter: string;
  isAbleToReport: boolean;
}

export interface CreateIdentifiableSupportingUsersJobOutDTO {
  createdSupportingUserId: number;
}

export interface CheckSupportingUserResponseJobInDTO {
  supportingUserId: number;
}
