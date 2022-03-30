import ApiClient from "./http/ApiClient";
import {
  ApplicationIdentifierOutDTO,
  ApplicationSupportingUsersInDTO,
  GetApplicationInDTO,
  SupportingUserFormDataInDTO,
  SupportingUserType,
  UpdateSupportingUserOutDTO,
} from "@/types";

export class SupportingUsersService {
  // Share Instance
  private static instance: SupportingUsersService;

  public static get shared(): SupportingUsersService {
    return this.instance || (this.instance = new this());
  }

  public async getApplicationDetails(
    supportingUserType: SupportingUserType,
    payload: ApplicationIdentifierOutDTO,
  ): Promise<GetApplicationInDTO> {
    return ApiClient.SupportingUserApi.getApplicationDetails(
      supportingUserType,
      payload,
    );
  }

  async updateSupportingInformation(
    supportingUserType: SupportingUserType,
    payload: UpdateSupportingUserOutDTO,
  ): Promise<void> {
    await ApiClient.SupportingUserApi.updateSupportingInformation(
      supportingUserType,
      payload,
    );
  }

  async getSupportingUsersForSideBar(
    applicationId: number,
  ): Promise<ApplicationSupportingUsersInDTO[]> {
    return ApiClient.SupportingUserApi.getSupportingUsersForSideBar(
      applicationId,
    );
  }

  async getSupportingUserData(
    supportingUserId: number,
  ): Promise<SupportingUserFormDataInDTO> {
    return ApiClient.SupportingUserApi.getSupportingUserData(supportingUserId);
  }
}
