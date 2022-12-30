import { SupportingUserType } from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";
import {
  ApplicationAPIOutDTO,
  ApplicationIdentifierAPIInDTO,
  ApplicationSupportingUsersAPIOutDTO,
  SupportingUserFormDataAPIOutDTO,
  UpdateSupportingUserAPIInDTO,
} from "./dto/SupportingUser.dto";

export class SupportingUserApi extends HttpBaseClient {
  public async getApplicationDetails(
    supportingUserType: SupportingUserType,
    payload: ApplicationIdentifierAPIInDTO,
  ): Promise<ApplicationAPIOutDTO> {
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
    payload: UpdateSupportingUserAPIInDTO,
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
  ): Promise<ApplicationSupportingUsersAPIOutDTO[]> {
    return this.getCallTyped<ApplicationSupportingUsersAPIOutDTO[]>(
      this.addClientRoot(`supporting-user/application/${applicationId}`),
    );
  }

  async getSupportingUserData(
    supportingUserId: number,
  ): Promise<SupportingUserFormDataAPIOutDTO> {
    return this.getCallTyped<SupportingUserFormDataAPIOutDTO>(
      this.addClientRoot(`supporting-user/${supportingUserId}`),
    );
  }
}
