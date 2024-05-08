import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ReportService } from "@sims/services";
import { getFileNameAsCurrentTimestamp } from "@sims/utilities";
import { Response } from "express";
import { Readable } from "stream";
import { FormService } from "../../services";
import { CustomNamedError } from "@sims/utilities";
import { MinistryReportsFilterAPIInDTO } from "./models/report.dto";
import { FormNames } from "../../services/form/constants";
import {
  FILTER_PARAMS_MISMATCH,
  REPORT_CONFIG_NOT_FOUND,
} from "@sims/services";

/**
 * Controller Service layer for reports.
 */
@Injectable()
export class ReportControllerService {
  constructor(
    private readonly reportService: ReportService,
    private readonly formService: FormService,
  ) {}

  /**
   * Generates report in csv format.
   * @param payload report filter payload.
   * @param response http response as file.
   */
  async generateReport(
    payload: MinistryReportsFilterAPIInDTO,
    response: Response,
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
    try {
      const reportData = await this.reportService.getReportDataAsCSV(
        submissionResult.data.data,
      );
      this.streamFile(response, payload.reportName, reportData);
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
  }

  /**
   * Stream file as downloadable response.
   * @param response http response as file.
   * @param reportName report name.
   * @param fileContent content of the file.
   */
  private streamFile(
    response: Response,
    reportName: string,
    fileContent: string,
  ) {
    const timestamp = getFileNameAsCurrentTimestamp();
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
