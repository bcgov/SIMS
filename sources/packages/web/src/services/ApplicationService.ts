import ApiClient from "../services/http/ApiClient";
import { PIRSummaryDTO } from "@/types/contracts/institution/ApplicationsDto";

export class ApplicationService {
  // Share Instance
  private static instance: ApplicationService;

  public static get shared(): ApplicationService {
    return this.instance || (this.instance = new this());
  }
  public async getNOA(applicationId: number): Promise<any> {
    return ApiClient.Application.getNOA(applicationId);
  }
  public async getPIRSummary(locationId: number): Promise<PIRSummaryDTO[]> {
    return ApiClient.Application.getPIRSummary(locationId);
  }
}
