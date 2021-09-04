import {
  COESummaryDTO,
  ApplicationDetailsForCOEDTO,
  COEDeniedReasonDto,
  DenyConfirmationOfEnrollment,
} from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";

export class ConfirmationOfEnrollmentApi extends HttpBaseClient {
  public async getCOESummary(locationId: number): Promise<COESummaryDTO[]> {
    try {
      const response = await this.apiClient.get(
        `institution/location/${locationId}/confirmation-of-enrollment`,
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getApplicationForCOE(
    applicationId: number,
    locationId: number,
  ): Promise<ApplicationDetailsForCOEDTO> {
    try {
      const response = await this.apiClient.get(
        `institution/location/${locationId}/confirmation-of-enrollment/application/${applicationId}`,
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async confirmCOE(
    locationId: number,
    applicationId: number,
  ): Promise<void> {
    try {
      await this.apiClient.patch(
        `institution/location/${locationId}/confirmation-of-enrollment/application/${applicationId}/confirm`,
        {},
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async rollbackCOE(
    locationId: number,
    applicationId: number,
  ): Promise<void> {
    try {
      await this.apiClient.post(
        `institution/location/${locationId}/confirmation-of-enrollment/application/${applicationId}/rollback`,
        null,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getCOEDenialReasons(): Promise<COEDeniedReasonDto> {
    try {
      const response = await this.apiClient.get(
        `institution/location/confirmation-of-enrollment/denial-reasons`,
        this.addAuthHeader(),
      );
      return response?.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async denyConfirmationOfEnrollment(
    locationId: number,
    applicationId: number,
    DenyCOEPayload: DenyConfirmationOfEnrollment,
  ): Promise<void> {
    try {
      await this.apiClient.patch(
        `institution/location/${locationId}/confirmation-of-enrollment/application/${applicationId}/deny`,
        DenyCOEPayload,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
