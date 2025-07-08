import HttpBaseClient from "./common/HttpBaseClient";
import {
  ApplicationAPIOutDTO,
  ApplicationIdentifierAPIInDTO,
  ReportedSupportingUserAPIInDTO,
  ReportedSupportingUserAPIOutDTO,
  SupportingUserFormDataAPIOutDTO,
  UpdateSupportingUserAPIInDTO,
} from "@/services/http/dto";

export class SupportingUserApi extends HttpBaseClient {
  public async getApplicationDetails(
    payload: ApplicationIdentifierAPIInDTO,
  ): Promise<ApplicationAPIOutDTO> {
    return this.postCall(
      this.addClientRoot(`supporting-user/application`),
      payload,
    );
  }

  public async updateSupportingInformation(
    payload: UpdateSupportingUserAPIInDTO,
  ): Promise<void> {
    await this.patchCall(this.addClientRoot(`supporting-user`), payload);
  }

  /**
   * Get supporting user details.
   * @param supportingUserId supporting user id.
   * @returns supporting user details.
   */
  async getSupportingUserData(
    supportingUserId: number,
  ): Promise<
    SupportingUserFormDataAPIOutDTO | ReportedSupportingUserAPIOutDTO
  > {
    return this.getCall(
      this.addClientRoot(`supporting-user/${supportingUserId}`),
    );
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
    await this.patchCall(
      this.addClientRoot(`supporting-user/${supportingUserId}`),
      payload,
    );
  }
}
