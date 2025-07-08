import { SupportingUser } from "@/types";
import ApiClient from "./http/ApiClient";
import {
  ApplicationAPIOutDTO,
  ApplicationIdentifierAPIInDTO,
  ReportedSupportingUserAPIInDTO,
  UpdateSupportingUserAPIInDTO,
} from "@/services/http/dto";

export class SupportingUsersService {
  // Share Instance
  private static instance: SupportingUsersService;

  static get shared(): SupportingUsersService {
    return this.instance || (this.instance = new this());
  }

  async getApplicationDetails(
    payload: ApplicationIdentifierAPIInDTO,
  ): Promise<ApplicationAPIOutDTO> {
    return ApiClient.SupportingUserApi.getApplicationDetails(payload);
  }

  async updateSupportingInformation(
    payload: UpdateSupportingUserAPIInDTO,
  ): Promise<void> {
    await ApiClient.SupportingUserApi.updateSupportingInformation(payload);
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
    payload: ReportedSupportingUserAPIInDTO,
  ): Promise<void> {
    await ApiClient.SupportingUserApi.updateSupportingUser(
      supportingUserId,
      payload,
    );
  }
}
