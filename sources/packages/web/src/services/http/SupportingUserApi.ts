import {
  ApplicationIdentifierInDTO,
  ApplicationSupportingUsersOutDTO,
  GetApplicationOutDTO,
  SupportingUserFormDataOutDTO,
  SupportingUserType,
  UpdateSupportingUserInDTO,
} from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";

export class SupportingUserApi extends HttpBaseClient {
  public async getApplicationDetails(
    supportingUserType: SupportingUserType,
    payload: ApplicationIdentifierInDTO,
  ): Promise<GetApplicationOutDTO> {
    try {
      const response = await this.apiClient.post(
        this.addClientRoot(`supporting-user/${supportingUserType}/application`),
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
    payload: UpdateSupportingUserInDTO,
  ): Promise<void> {
    try {
      await this.apiClient.patch(
        this.addClientRoot(`supporting-user/${supportingUserType}`),
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
  ): Promise<ApplicationSupportingUsersOutDTO[]> {
    return this.getCallTyped<ApplicationSupportingUsersOutDTO[]>(
      this.addClientRoot(`supporting-user/application/${applicationId}`),
    );
  }

  async getSupportingUserData(
    supportingUserId: number,
  ): Promise<SupportingUserFormDataOutDTO> {
    return this.getCallTyped<SupportingUserFormDataOutDTO>(
      this.addClientRoot(`supporting-user/${supportingUserId}`),
    );
  }
}
