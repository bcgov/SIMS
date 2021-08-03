import HttpBaseClient from "./common/HttpBaseClient";

export class ProgramInfoRequestApi extends HttpBaseClient {
  public async getProgramInfoRequest(
    locationId: number,
    applicationId: number,
  ): Promise<any> {
    const response = await this.apiClient.get(
      `institution/location/${locationId}/program-info-request/application/${applicationId}`,
      this.addAuthHeader(),
    );
    return response.data;
  }
}
