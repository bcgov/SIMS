import ApiClient from "../services/http/ApiClient";

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
  public async confirmationOfAssessment(applicationId: number): Promise<void> {
    return ApiClient.Application.confirmationOfAssessment(applicationId);
  }
}
