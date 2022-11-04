import { SupportingUserType } from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";
import {
  ApplicationApiOutDTO,
  ApplicationIdentifierApiInDTO,
  ApplicationSupportingUsersApiOutDTO,
  SupportingUserFormDataApiOutDTO,
  UpdateSupportingUserApiInDTO,
} from "./dto/SupportingUser.dto";

export class SupportingUserApi extends HttpBaseClient {
  public async getApplicationDetails(
    supportingUserType: SupportingUserType,
    payload: ApplicationIdentifierApiInDTO,
  ): Promise<ApplicationApiOutDTO> {
    try {
      return await this.postCall(
        this.addClientRoot(`supporting-user/${supportingUserType}/application`),
        payload,
      );
    } catch (error: unknown) {
      this.handleAPICustomError(error);
      throw error;
    }
  }

  public async updateSupportingInformation(
    supportingUserType: SupportingUserType,
    payload: UpdateSupportingUserApiInDTO,
  ): Promise<void> {
    try {
      await this.patchCall(
        this.addClientRoot(`supporting-user/${supportingUserType}`),
        payload,
      );
    } catch (error) {
      this.handleAPICustomError(error);
      throw error;
    }
  }

  async getSupportingUsersForSideBar(
    applicationId: number,
  ): Promise<ApplicationSupportingUsersApiOutDTO[]> {
    return this.getCallTyped<ApplicationSupportingUsersApiOutDTO[]>(
      this.addClientRoot(`supporting-user/application/${applicationId}`),
    );
  }

  async getSupportingUserData(
    supportingUserId: number,
  ): Promise<SupportingUserFormDataApiOutDTO> {
    return this.getCallTyped<SupportingUserFormDataApiOutDTO>(
      this.addClientRoot(`supporting-user/${supportingUserId}`),
    );
  }
}
