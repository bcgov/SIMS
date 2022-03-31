import HttpBaseClient from "./common/HttpBaseClient";
import {
  ApplicationApiOutDTO,
  ApplicationIdentifierApiInDTO,
  ApplicationSupportingUsersApiOutDTO,
  SupportingUserFormDataApiOutDTO,
  SupportingUserType,
  UpdateSupportingUserApiInDTO,
} from "./dto/SupportingUser.dto";

export class SupportingUserApi extends HttpBaseClient {
  public async getApplicationDetails(
    supportingUserType: SupportingUserType,
    payload: ApplicationIdentifierApiInDTO,
  ): Promise<ApplicationApiOutDTO> {
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
    payload: UpdateSupportingUserApiInDTO,
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
