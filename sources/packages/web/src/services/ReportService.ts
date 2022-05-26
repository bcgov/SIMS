import ApiClient from "@/services/http/ApiClient";
import { ReportsFilterAPIInDTO } from "@/services/http/dto";
import { AxiosResponse } from "axios";

/**
 * Client service layer for Reports.
 */
export class ReportService {
  // Shared Instance
  private static instance: ReportService;

  public static get shared(): ReportService {
    return this.instance || (this.instance = new this());
  }

  async exportReport(
    payload: ReportsFilterAPIInDTO,
  ): Promise<AxiosResponse<any>> {
    return ApiClient.ReportApi.exportReport(payload);
  }
}
