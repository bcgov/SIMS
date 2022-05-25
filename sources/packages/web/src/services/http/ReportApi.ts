import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { ReportsFilterAPIInDTO } from "@/services/http/dto";
import { AxiosResponse } from "axios";
/**
 * Http API client for Reports.
 */
export class ReportApi extends HttpBaseClient {
  async exportReport(
    payload: ReportsFilterAPIInDTO,
  ): Promise<AxiosResponse<any>> {
    return this.downloadFile<ReportsFilterAPIInDTO>("reports", payload);
  }
}
