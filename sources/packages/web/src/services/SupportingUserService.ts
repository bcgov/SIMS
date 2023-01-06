import { SupportingUserType } from "@/types";
import ApiClient from "./http/ApiClient";
import {
  ApplicationAPIOutDTO,
  ApplicationIdentifierAPIInDTO,
  ApplicationSupportingUsersAPIOutDTO,
  SupportingUserFormDataAPIOutDTO,
  UpdateSupportingUserAPIInDTO,
} from "./http/dto/SupportingUser.dto";

export class SupportingUsersService {
  // Share Instance
  private static instance: SupportingUsersService;

  static get shared(): SupportingUsersService {
    return this.instance || (this.instance = new this());
  }

  async getApplicationDetails(
    supportingUserType: SupportingUserType,
    payload: ApplicationIdentifierAPIInDTO,
  ): Promise<ApplicationAPIOutDTO> {
    return ApiClient.SupportingUserApi.getApplicationDetails(
      supportingUserType,
      payload,
    );
  }

  async updateSupportingInformation(
    supportingUserType: SupportingUserType,
    payload: UpdateSupportingUserAPIInDTO,
  ): Promise<void> {
    await ApiClient.SupportingUserApi.updateSupportingInformation(
      supportingUserType,
      payload,
    );
  }

  async getSupportingUsersForSideBar(
    applicationId: number,
  ): Promise<ApplicationSupportingUsersAPIOutDTO[]> {
    return ApiClient.SupportingUserApi.getSupportingUsersForSideBar(
      applicationId,
    );
  }

  async getSupportingUserData(
    supportingUserId: number,
  ): Promise<SupportingUserFormDataAPIOutDTO> {
    return ApiClient.SupportingUserApi.getSupportingUserData(supportingUserId);
  }
}
