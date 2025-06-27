import { SupportingUserType } from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";
import {
  ApplicationAPIOutDTO,
  ApplicationIdentifierAPIInDTO,
  StudentReportSupportingUserAPIInDTO,
  StudentSupportingUserAPIOutDTO,
  SupportingUserFormDataAPIOutDTO,
  UpdateSupportingUserAPIInDTO,
} from "@/services/http/dto";

export class SupportingUserApi extends HttpBaseClient {
  public async getApplicationDetails(
    supportingUserType: SupportingUserType,
    payload: ApplicationIdentifierAPIInDTO,
  ): Promise<ApplicationAPIOutDTO> {
    return this.postCall(
      this.addClientRoot(`supporting-user/${supportingUserType}/application`),
      payload,
    );
  }

  public async updateSupportingInformation(
    supportingUserType: SupportingUserType,
    payload: UpdateSupportingUserAPIInDTO,
  ): Promise<void> {
    await this.patchCall(
      this.addClientRoot(`supporting-user/${supportingUserType}`),
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
  ): Promise<SupportingUserFormDataAPIOutDTO | StudentSupportingUserAPIOutDTO> {
    return this.getCall<
      SupportingUserFormDataAPIOutDTO | StudentSupportingUserAPIOutDTO
    >(this.addClientRoot(`supporting-user/${supportingUserId}`));
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
    await this.patchCall(
      this.addClientRoot(`supporting-user/${supportingUserId}`),
      payload,
    );
  }
}
