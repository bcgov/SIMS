import { Injectable } from "@nestjs/common";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import {
  ConfigService,
  DisbursementReceiptService,
  ReportService,
} from "../../services";
import { ReportsFilterModel } from "../../services/report/report.models";
import { DisbursementReceiptIntegrationService } from "./disbursement-receipt-integration.service";
import { DAILY_DISBURSEMENT_REPORT_NAME } from "../../utilities";

@Injectable()
export class DisbursementReceiptRequestService {
  constructor(
    configService: ConfigService,
    private readonly reportService: ReportService,
    private readonly disbursementReceiptService: DisbursementReceiptService,
    private readonly integrationService: DisbursementReceiptIntegrationService,
  ) {}

  /**
   * 1. Fetches the Daily disbursement information based on the batchRunDate
   * or max date if its not provided.
   * 2. Create a csv file of the total records sent on the process date.
   * 3. Upload the content to the zoneB SFTP server.
   * @param batchRunDate Date in which the daily disbursement records needs to be fetched.
   * @returns Processing Daily Disbursement request result.
   */
  async processProvincialDailyDisbursements(
    batchRunDate?: Date,
  ): Promise<string> {
    // Latest batch run date is fetched, as the assumption is the disbursement receipt scheduler
    // runs for a single file and the report is generated.
    // If the batch run date is specified for maintenance purpose, that will be taken
    // into account and the report will be generated.
    if (!batchRunDate) {
      batchRunDate =
        await this.disbursementReceiptService.getMaxDisbursementReceiptDate();
    }
    this.logger.log(
      `Fetches the Daily disbursement information which are not sent on ${batchRunDate}`,
    );

    // Populate the reportName and batchRunDate to the reportsFilterMode.
    const reportFilterModel: ReportsFilterModel = {
      reportName: DAILY_DISBURSEMENT_REPORT_NAME,
      params: { batchRunDate },
    };

    // Fetch the reports data and convert them into CSV.
    const dailyDisbursementsRecordsInCSV =
      await this.reportService.getReportDataAsCSV(reportFilterModel);

    // Create requestFilename with the reportName.
    const remoteFilePath = this.integrationService.createRequestFileName(
      DAILY_DISBURSEMENT_REPORT_NAME,
    );

    // Upload the Daily disbursement report content in the SFTP server.
    return this.integrationService.uploadRawContent(
      dailyDisbursementsRecordsInCSV,
      remoteFilePath.filePath,
    );
  }

  @InjectLogger()
  logger: LoggerService;
}
