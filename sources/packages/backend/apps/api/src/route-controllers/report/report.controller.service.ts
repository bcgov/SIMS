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
  appendByteOrderMark,
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
    // Adding byte order mark characters to the original file content as applications
    // like excel would look for BOM characters to view the file as UTF8 encoded.
    // Append byte order mark characters only if the file content is not empty.
    const responseBuffer = fileContent
      ? appendByteOrderMark(fileContent)
      : Buffer.from("");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename=${filename}`,
    );
    response.setHeader("Content-Type", "text/csv");
    response.setHeader("Content-Length", responseBuffer.byteLength);

    const stream = new Readable();
    stream.push(responseBuffer);
    stream.push(null);
    stream.pipe(response);
  }
}
