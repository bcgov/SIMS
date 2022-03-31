import ApiClient from "./http/ApiClient";
import { SupportingUserType } from "@/types";
import {
  ApplicationApiOutDTO,
  ApplicationIdentifierApiInDTO,
  ApplicationSupportingUsersApiOutDTO,
  SupportingUserFormDataApiOutDTO,
  UpdateSupportingUserApiInDTO,
} from "./http/dto/SupportingUser.dto";

export class SupportingUsersService {
  // Share Instance
  private static instance: SupportingUsersService;

  public static get shared(): SupportingUsersService {
    return this.instance || (this.instance = new this());
  }

  public async getApplicationDetails(
    supportingUserType: SupportingUserType,
    payload: ApplicationIdentifierApiInDTO,
  ): Promise<ApplicationApiOutDTO> {
    return ApiClient.SupportingUserApi.getApplicationDetails(
      supportingUserType,
      payload,
    );
  }

  async updateSupportingInformation(
    supportingUserType: SupportingUserType,
    payload: UpdateSupportingUserApiInDTO,
  ): Promise<void> {
    await ApiClient.SupportingUserApi.updateSupportingInformation(
      supportingUserType,
      payload,
    );
  }

  async getSupportingUsersForSideBar(
    applicationId: number,
  ): Promise<ApplicationSupportingUsersApiOutDTO[]> {
    return ApiClient.SupportingUserApi.getSupportingUsersForSideBar(
      applicationId,
    );
  }

  async getSupportingUserData(
    supportingUserId: number,
  ): Promise<SupportingUserFormDataApiOutDTO> {
    return ApiClient.SupportingUserApi.getSupportingUserData(supportingUserId);
  }
}
