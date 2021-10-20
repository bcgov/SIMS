import ApiClient from "./http/ApiClient";
import { SupportingUserType, UpdateSupportingUserDTO } from "@/types";

export class SupportingUsersService {
  // Share Instance
  private static instance: SupportingUsersService;

  public static get shared(): SupportingUsersService {
    return this.instance || (this.instance = new this());
  }

  async updateSupportingInformation(
    supportingUserType: SupportingUserType,
    payload: UpdateSupportingUserDTO,
  ): Promise<void> {
    await ApiClient.SupportingUserApi.updateSupportingInformation(
      supportingUserType,
      payload,
    );
  }
}
