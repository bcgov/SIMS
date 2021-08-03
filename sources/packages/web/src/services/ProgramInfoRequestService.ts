import ApiClient from "./http/ApiClient";

export class ProgramInfoRequestService {
  // Share Instance
  private static instance: ProgramInfoRequestService;

  public static get shared(): ProgramInfoRequestService {
    return this.instance || (this.instance = new this());
  }

  async getProgramInfoRequest(
    locationId: number,
    applicationId: number,
  ): Promise<any> {
    return ApiClient.ProgramInfoRequest.getProgramInfoRequest(
      locationId,
      applicationId,
    );
  }
}
