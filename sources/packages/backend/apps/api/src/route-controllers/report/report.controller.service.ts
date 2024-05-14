import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ReportService,
  FILTER_PARAMS_MISMATCH,
  REPORT_CONFIG_NOT_FOUND,
} from "@sims/services";
import {
  getFileNameAsCurrentTimestamp,
  CustomNamedError,
} from "@sims/utilities";
import { Response } from "express";
import { Readable } from "stream";
import { FormService, ProgramYearService } from "../../services";
import { ReportsFilterAPIInDTO } from "./models/report.dto";
import { FormNames } from "../../services/form/constants";

/**
 * Controller Service layer for reports.
 */
@Injectable()
export class ReportControllerService {
  constructor(
    private readonly reportService: ReportService,
    private readonly formService: FormService,
    private readonly programYearService: ProgramYearService,
  ) {}

  /**
   * Generates report in csv format.
   * @param payload report filter payload.
   * @param response http response as file.
   * @param options related options.
   * - `institutionId` related institution id.
   */
  async generateReport(
    payload: ReportsFilterAPIInDTO,
    response: Response,
    options?: { institutionId?: number },
  ): Promise<void> {
    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.ExportFinancialReports,
      payload,
    );
    if (
      !submissionResult.valid ||
      !this.programYearExists(payload.params.programYear as number)
    ) {
      throw new BadRequestException(
        "Not able to export report due to an invalid request.",
      );
    }
    if (options?.institutionId) {
      submissionResult.data.data.params.institutionId = options.institutionId;
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
        }
      }
      throw error;
    }
  }

  /**
   * Checks for the existence of the provided program year.
   * @param programYear program year to validate.
   * @returns boolean indicating if the programYear exists or not.
   */
  private async programYearExists(programYear: number): Promise<boolean> {
    const programYears = await this.programYearService.getProgramYears();
    const activeProgramYears = programYears.map(
      (programYear) => programYear.id,
    );
    return activeProgramYears.includes(programYear);
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
