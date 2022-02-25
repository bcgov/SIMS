import {
  ApplicationIdentifierDTO,
  ApplicationSupportingUsersDTO,
  GetApplicationDTO,
  SupportingUserFormData,
  SupportingUserType,
  UpdateSupportingUserDTO,
} from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";

export class SupportingUserApi extends HttpBaseClient {
  public async getApplicationDetails(
    supportingUserType: SupportingUserType,
    payload: ApplicationIdentifierDTO,
  ): Promise<GetApplicationDTO> {
    try {
      const response = await this.apiClient.post(
        `supporting-user/${supportingUserType}/application`,
        payload,
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      if (!error.response.data?.errorType) {
        // If it is an not expected error,
        // handle it the default way.
        this.handleRequestError(error);
      }
      throw error;
    }
  }

  public async updateSupportingInformation(
    supportingUserType: SupportingUserType,
    payload: UpdateSupportingUserDTO,
  ): Promise<void> {
    try {
      await this.apiClient.patch(
        `supporting-user/${supportingUserType}`,
        payload,
        this.addAuthHeader(),
      );
    } catch (error) {
      if (!error.response.data?.errorType) {
        // If it is an not expected error,
        // handle it the default way.
        this.handleRequestError(error);
      }
      throw error;
    }
  }

  async getSupportingUsersForSideBar(
    applicationId: number,
  ): Promise<ApplicationSupportingUsersDTO[]> {
    return this.getCallTyped<ApplicationSupportingUsersDTO[]>(
      this.addClientRoot(`supporting-user/application/${applicationId}`),
    );
  }

  async getSupportingUserData(
    supportingUserId: number,
  ): Promise<SupportingUserFormData> {
    return this.getCallTyped<SupportingUserFormData>(
      this.addClientRoot(`supporting-user/${supportingUserId}`),
    );
  }
}
