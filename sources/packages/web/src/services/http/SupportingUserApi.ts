import {
  ApplicationIdentifierOutDTO,
  ApplicationSupportingUsersInDTO,
  GetApplicationInDTO,
  SupportingUserFormDataInDTO,
  SupportingUserType,
  UpdateSupportingUserOutDTO,
} from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";

export class SupportingUserApi extends HttpBaseClient {
  public async getApplicationDetails(
    supportingUserType: SupportingUserType,
    payload: ApplicationIdentifierOutDTO,
  ): Promise<GetApplicationInDTO> {
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
    payload: UpdateSupportingUserOutDTO,
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
  ): Promise<ApplicationSupportingUsersInDTO[]> {
    return this.getCallTyped<ApplicationSupportingUsersInDTO[]>(
      this.addClientRoot(`supporting-user/application/${applicationId}`),
    );
  }

  async getSupportingUserData(
    supportingUserId: number,
  ): Promise<SupportingUserFormDataInDTO> {
    return this.getCallTyped<SupportingUserFormDataInDTO>(
      this.addClientRoot(`supporting-user/${supportingUserId}`),
    );
  }
}
