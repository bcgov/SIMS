import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { Response } from "express";
import { Readable } from "stream";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import { ReportService, FormService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import { StringBuilder } from "../../utilities/string-builder";
import {
  getDateOnlyFormatAsString,
  getFileNameTimestamp,
  CustomNamedError,
} from "../../utilities";
import BaseController from "../BaseController";
import { ReportsFilterAPIInDTO } from "./models/report.dto";
import { FormNames } from "../../services/form/constants";
import {
  REPORT_CONFIG_NOT_FOUND,
  FILTER_PARAMS_MISMATCH,
} from "../../services/report/constants";

/**
 * Controller for Reports for AEST Client.
 * This consists of all Rest APIs for notes.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("reports")
@ApiTags(`${ClientTypeBaseRoute.AEST}-reports`)
export class ReportAESTController extends BaseController {
  constructor(
    private readonly reportService: ReportService,
    private readonly formService: FormService,
  ) {
    super();
  }

  /**
   * Rest API to financial reports in csv format.
   * @param payload report filter payload.
   * @param response
   */
  @ApiBadRequestResponse({
    description: "Not able to export report due to an invalid request.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Either report config missing or filter parameters not matching the report config.",
  })
  @Post()
  async exportReport(
    @Body() payload: ReportsFilterAPIInDTO,
    @Res() response: Response,
  ): Promise<void> {
    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.ExportFinancialReports,
      payload,
    );

    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to export report due to an invalid request.",
      );
    }

    let reportData = [];

    try {
      reportData = await this.reportService.exportReport(payload);
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case REPORT_CONFIG_NOT_FOUND:
          case FILTER_PARAMS_MISMATCH:
            throw new UnprocessableEntityException(error.message);
          default:
            throw error;
        }
      }
      throw error;
    }

    if (!reportData || reportData.length === 0) {
      this.streamFile(response, payload.reportName, "No data found.");
      return;
    }

    const reportCSVContent = new StringBuilder();
    const reportHeaders = Object.keys(reportData[0]);
    reportCSVContent.appendLine(reportHeaders.join(","));

    reportData.forEach((reportDataItem) => {
      let dataItem = "";
      reportHeaders.forEach((header, index) => {
        const data =
          reportDataItem[header] instanceof Date
            ? getDateOnlyFormatAsString(reportDataItem[header])
            : reportDataItem[header];
        dataItem += index ? `,${data}` : data;
      });
      reportCSVContent.appendLine(dataItem);
    });
    this.streamFile(response, payload.reportName, reportCSVContent.toString());
  }

  /**
   * Stream file as downloadable response.
   * @param response
   * @param reportName report name.
   * @param fileContent content of the file.
   */
  private streamFile(
    response: Response,
    reportName: string,
    fileContent: string,
  ) {
    const timestamp = getFileNameTimestamp();
    const filename = `${reportName}_${timestamp}.csv`;
    response.setHeader(
      "Content-Disposition",
      `attachment; filename=${filename}`,
    );
    response.setHeader("Content-Type", "text/csv");
    response.setHeader("Content-Length", fileContent.toString().length);

    const stream = new Readable();
    stream.push(fileContent.toString());
    stream.push(null);
    stream.pipe(response);
  }
}
