import { SupportingUser, SupportingUserType } from "@/types";
import ApiClient from "./http/ApiClient";
import {
  ApplicationAPIOutDTO,
  ApplicationIdentifierAPIInDTO,
  StudentReportSupportingUserAPIInDTO,
  UpdateSupportingUserAPIInDTO,
} from "@/services/http/dto";

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

  /**
   * Get supporting user details.
   * @param supportingUserId supporting user id.
   * @returns supporting user details.
   */
  async getSupportingUserData(
    supportingUserId: number,
  ): Promise<SupportingUser> {
    return ApiClient.SupportingUserApi.getSupportingUserData(supportingUserId);
  }

  /**
   * Update supporting user.
   * @param supportingUserId supporting user id.
   * @param payload supporting user payload.
   */
  async updateSupportingUser(
    supportingUserId: number,
    payload: StudentReportSupportingUserAPIInDTO,
  ): Promise<void> {
    await ApiClient.SupportingUserApi.updateSupportingUser(
      supportingUserId,
      payload,
    );
  }
}
