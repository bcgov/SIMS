import { GetProgramInfoRequestDto, PIRSummaryDTO } from "@/types";
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
  ): Promise<GetProgramInfoRequestDto> {
    return ApiClient.ProgramInfoRequest.getProgramInfoRequest(
      locationId,
      applicationId,
    );
  }

  public async completeProgramInfoRequest(
    locationId: number,
    applicationId: number,
    data: any,
  ): Promise<void> {
    await ApiClient.ProgramInfoRequest.completeProgramInfoRequest(
      locationId,
      applicationId,
      data,
    );
  }

  public async getPIRSummary(locationId: number): Promise<PIRSummaryDTO[]> {
    return ApiClient.ProgramInfoRequest.getPIRSummary(locationId);
  }
}
