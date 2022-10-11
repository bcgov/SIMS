import { SupportingUserType } from "@sims/sims-db";

export class CreateSupportingUsersJobInDTO {
  applicationId: number;
  supportingUsersTypes: SupportingUserType[];
}

export class CreateSupportingUsersJobOutDTO {
  createdSupportingUsersIds: number[];
}

export class CheckSupportingUserResponseJobInDTO {
  supportingUserId: number;
}
