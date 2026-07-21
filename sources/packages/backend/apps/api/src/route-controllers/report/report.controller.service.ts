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
  addDays,
  getISODateOnlyString,
} from "@sims/utilities";
import { Response } from "express";
import { FormService, ProgramYearService } from "../../services";
import { ReportsFilterAPIInDTO } from "./models/report.dto";
import { FormNames } from "../../services/form/constants";
import { streamFile } from "../utils";
import { ConfigService } from "@sims/utilities/config";
import dayjs from "dayjs";

/**
 * Controller Service layer for reports.
 */
@Injectable()
export class ReportControllerService {
  constructor(
    private readonly reportService: ReportService,
    private readonly formService: FormService,
    private readonly programYearService: ProgramYearService,
    private readonly configService: ConfigService,
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
    if (submissionResult.data.data.params["program"] === "") {
      submissionResult.data.data.params["program"] = 0;
    }
    if (payload.params.programYear) {
      const programYearExists = await this.programYearService.programYearExists(
        payload.params.programYear as number,
      );
      if (!programYearExists) {
        throw new BadRequestException(
          "Not able to export report due to an invalid program year.",
        );
      }
    }
    if (options?.institutionId) {
      submissionResult.data.data.params.institutionId = options.institutionId;
    }
    // Ensure report period will be restricted by the archive date limit if the report
    // is being generated for a period that exceeds the archive date limit.
    if (
      submissionResult.data.data.params.isStartDateLimitedByArchiveDate === true
    ) {
      // This should be removed from the params to avoid the report query to fail due to an unknown parameter.
      delete submissionResult.data.data.params.isStartDateLimitedByArchiveDate;
      const archiveStartDateLimit = addDays(
        -this.configService.applicationArchiveDays,
        getISODateOnlyString(new Date()),
      );
      const startDate = dayjs(
        submissionResult.data.data.params.startDate as string,
      );
      if (startDate.isBefore(archiveStartDateLimit)) {
        // Overwrite the start date to ensure the report will be generated for
        //  a period that is within the archive date limit.
        submissionResult.data.data.params.startDate = getISODateOnlyString(
          archiveStartDateLimit,
        );
      }
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
