import { Body, Controller, Post, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { Readable } from "stream";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import { ReportService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import { StringBuilder } from "../../utilities/string-builder";
import {
  getDateOnlyFormat,
  getDateTimeInContinuousFormat,
} from "../../utilities";
import BaseController from "../BaseController";
import { ReportsFilterAPIInDTO } from "./models/report.dto";

/**
 * Controller for Reports for AEST Client.
 * This consists of all Rest APIs for notes.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("reports")
@ApiTags(`${ClientTypeBaseRoute.AEST}-reports`)
export class ReportAESTController extends BaseController {
  constructor(private readonly reportService: ReportService) {
    super();
  }

  /**
   * Rest API to financial reports in csv format.
   * @param payload report filter payload.
   * @param response
   */

  @Post()
  async exportReport(
    @Body() payload: ReportsFilterAPIInDTO,
    @Res() response: Response,
  ): Promise<void> {
    const reportData = await this.reportService.exportReport(payload);
    const reportCSVContent = new StringBuilder();
    const reportHeaders = Object.keys(reportData[0]);
    reportCSVContent.appendLine(reportHeaders.join(","));

    reportData.forEach((reportDataItem) => {
      let dataItem = "";
      reportHeaders.forEach((header, index) => {
        const data =
          reportDataItem[header] instanceof Date
            ? getDateOnlyFormat(reportDataItem[header])
            : reportDataItem[header];
        dataItem += index ? `,${data}` : data;
      });
      reportCSVContent.appendLine(dataItem);
    });
    const timestamp = getDateTimeInContinuousFormat(new Date());
    const filename = `${payload.reportName}${timestamp}.csv`;
    response.setHeader(
      "Content-Disposition",
      `attachment; filename=${filename}`,
    );
    response.setHeader("Content-Type", "text/csv");
    response.setHeader("Content-Length", reportCSVContent.toString().length);

    const stream = new Readable();
    stream.push(reportCSVContent.toString());
    stream.push(null);
    stream.pipe(response);
  }
}
