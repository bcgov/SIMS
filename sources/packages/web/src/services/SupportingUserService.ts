import ApiClient from "./http/ApiClient";
import {
  ApplicationIdentifierDTO,
  ApplicationSupportingUsersDTO,
  GetApplicationDTO,
  SupportingUserType,
  UpdateSupportingUserDTO,
} from "@/types";

export class SupportingUsersService {
  // Share Instance
  private static instance: SupportingUsersService;

  public static get shared(): SupportingUsersService {
    return this.instance || (this.instance = new this());
  }

  public async getApplicationDetails(
    supportingUserType: SupportingUserType,
    payload: ApplicationIdentifierDTO,
  ): Promise<GetApplicationDTO> {
    return ApiClient.SupportingUserApi.getApplicationDetails(
      supportingUserType,
      payload,
    );
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

  async getSupportingUserForSideBar(
    applicationId: number,
  ): Promise<ApplicationSupportingUsersDTO[]> {
    return ApiClient.SupportingUserApi.getSupportingUserForSideBar(
      applicationId,
    );
  }
}
