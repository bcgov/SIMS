import { SupportingUserType, UpdateSupportingUserDTO } from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";

export class SupportingUserApi extends HttpBaseClient {
  public async updateSupportingInformation(
    applicationNumber: string,
    supportingUserType: SupportingUserType,
    payload: UpdateSupportingUserDTO,
  ): Promise<void> {
    try {
      const response = await this.apiClient.patch(
        `supporting-user/application/${applicationNumber}/userType/${supportingUserType}`,
        payload,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
