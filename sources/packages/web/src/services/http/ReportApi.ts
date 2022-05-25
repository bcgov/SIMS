import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { ReportsFilterAPIInDTO } from "@/services/http/dto";

/**
 * Http API client for Reports.
 */
export class ReportApi extends HttpBaseClient {
  async exportReport(payload: ReportsFilterAPIInDTO): Promise<void> {
    await this.downloadFile<ReportsFilterAPIInDTO>("reports", payload);
  }
}
