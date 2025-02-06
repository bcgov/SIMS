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
import { FormService, ProgramYearService } from "../../services";
import { ReportsFilterAPIInDTO } from "./models/report.dto";
import { FormNames } from "../../services/form/constants";
import { streamFile } from "../utils";

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
  async generateReport<T extends ReportsFilterAPIInDTO>(
    payload: T,
    response: Response,
    options?: { institutionId?: number },
  ): Promise<void> {
    const submissionResult = await this.formService.dryRunSubmission<T>(
      FormNames.ExportFinancialReports,
      payload,
    );
    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to export report due to an invalid request.",
      );
    }
    // In case the `institution` is present as optional in the submission it will be sent as an empty string (in case it is not provided)
    // or as a number (in case one institution was selected). To ensure the dynamic parameter will always be sent with the same type, the default 0 is used.
    if (submissionResult.data.data.params["institution"] === "") {
      submissionResult.data.data.params["institution"] = 0;
    }
    const programYearExists = await this.programYearService.programYearExists(
      payload.params.programYear as number,
    );
    if (!programYearExists) {
      throw new BadRequestException(
        "Not able to export report due to an invalid program year.",
      );
    }
    if (options?.institutionId) {
      submissionResult.data.data.params.institutionId = options.institutionId;
    }
    try {
      const reportData = await this.reportService.getReportDataAsCSV(
        submissionResult.data.data,
      );
      const timestamp = getFileNameAsCurrentTimestamp();
      const filename = `${payload.reportName}_${timestamp}.csv`;
      streamFile(response, filename, { fileContent: reportData });
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
}
