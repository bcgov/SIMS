import {
  CompleteProgramInfoRequestDto,
  DenyProgramInfoRequestDto,
  GetProgramInfoRequestDto,
  PIRSummaryDTO,
  GetPIRDeniedReasonDto,
} from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";

export class ProgramInfoRequestApi extends HttpBaseClient {
  public async getProgramInfoRequest(
    locationId: number,
    applicationId: number,
  ): Promise<GetProgramInfoRequestDto> {
    const response = await this.apiClient.get(
      `institution/location/${locationId}/program-info-request/application/${applicationId}`,
      this.addAuthHeader(),
    );
    return response.data;
  }

  public async completeProgramInfoRequest(
    locationId: number,
    applicationId: number,
    data: CompleteProgramInfoRequestDto,
  ): Promise<void> {
    try {
      await this.apiClient.patch(
        `institution/location/${locationId}/program-info-request/application/${applicationId}/complete`,
        { ...data },
        this.addAuthHeader(),
      );
    } catch (error: unknown) {
      this.handleAPICustomError(error);
    }
  }

  public async denyProgramInfoRequest(
    locationId: number,
    applicationId: number,
    data: DenyProgramInfoRequestDto,
  ): Promise<void> {
    await this.apiClient.patch(
      `institution/location/${locationId}/program-info-request/application/${applicationId}/deny`,
      { ...data },
      this.addAuthHeader(),
    );
  }

  public async getPIRSummary(locationId: number): Promise<PIRSummaryDTO[]> {
    try {
      const response = await this.apiClient.get(
        `institution/location/${locationId}/program-info-request`,
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getPIRDeniedReasonList(): Promise<GetPIRDeniedReasonDto[]> {
    try {
      const response = await this.apiClient.get(
        `institution/location/program-info-request/denied-reason`,
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
