import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { ReportsFilterAPIInDTO } from "@/services/http/dto";

/**
 * Http API client for Reports.
 */
export class ReportApi extends HttpBaseClient {
  public async exportReport(
    payload: ReportsFilterAPIInDTO,
    fileName: string,
  ): Promise<void> {
    await this.downloadFileOnPost<ReportsFilterAPIInDTO>(
      "reports",
      payload,
      fileName,
    );
  }
}
