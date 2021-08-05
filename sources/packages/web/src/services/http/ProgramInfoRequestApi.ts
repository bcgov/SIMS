import { GetProgramInfoRequestDto, PIRSummaryDTO } from "@/types";
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
    data: any,
  ): Promise<void> {
    await this.apiClient.patch(
      `institution/location/${locationId}/program-info-request/application/${applicationId}/complete`,
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
}
