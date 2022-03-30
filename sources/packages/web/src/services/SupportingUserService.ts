import ApiClient from "./http/ApiClient";
import {
  ApplicationIdentifierInDTO,
  ApplicationSupportingUsersOutDTO,
  GetApplicationOutDTO,
  SupportingUserFormDataOutDTO,
  SupportingUserType,
  UpdateSupportingUserInDTO,
} from "@/types";

export class SupportingUsersService {
  // Share Instance
  private static instance: SupportingUsersService;

  public static get shared(): SupportingUsersService {
    return this.instance || (this.instance = new this());
  }

  public async getApplicationDetails(
    supportingUserType: SupportingUserType,
    payload: ApplicationIdentifierInDTO,
  ): Promise<GetApplicationOutDTO> {
    return ApiClient.SupportingUserApi.getApplicationDetails(
      supportingUserType,
      payload,
    );
  }

  async updateSupportingInformation(
    supportingUserType: SupportingUserType,
    payload: UpdateSupportingUserInDTO,
  ): Promise<void> {
    await ApiClient.SupportingUserApi.updateSupportingInformation(
      supportingUserType,
      payload,
    );
  }

  async getSupportingUsersForSideBar(
    applicationId: number,
  ): Promise<ApplicationSupportingUsersOutDTO[]> {
    return ApiClient.SupportingUserApi.getSupportingUsersForSideBar(
      applicationId,
    );
  }

  async getSupportingUserData(
    supportingUserId: number,
  ): Promise<SupportingUserFormDataOutDTO> {
    return ApiClient.SupportingUserApi.getSupportingUserData(supportingUserId);
  }
}
