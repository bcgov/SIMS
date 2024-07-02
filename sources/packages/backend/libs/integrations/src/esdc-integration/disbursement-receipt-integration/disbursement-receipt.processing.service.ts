import { Injectable } from "@nestjs/common";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { DisbursementReceiptIntegrationService } from "./disbursement-receipt.integration.service";
import { ProcessSFTPResponseResult } from "../models/esdc-integration.model";
import { DisbursementReceiptDownloadResponse } from "./models/disbursement-receipt-integration.model";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import {
  DisbursementReceiptService,
  DisbursementScheduleService,
} from "@sims/integrations/services";
import {
  NotificationActionsService,
  ReportService,
  ReportsFilterModel,
} from "@sims/services";
import { PROVINCIAL_DAILY_DISBURSEMENT_REPORT_NAME } from "@sims/services/constants";

/**
 * Disbursement schedule map which consists of disbursement schedule id for a document number.
 */
interface DisbursementScheduleMap {
  [documentNumber: string]: number;
}

/**
 * Manages the process to import disbursement receipt files which are
 * downloaded from SFTP location.
 */
@Injectable()
export class DisbursementReceiptProcessingService {
  private readonly esdcConfig: ESDCIntegrationConfig;
  constructor(
    config: ConfigService,
    private readonly integrationService: DisbursementReceiptIntegrationService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
    private readonly disbursementReceiptService: DisbursementReceiptService,
    private readonly reportService: ReportService,
    private readonly notificationActionsService: NotificationActionsService,
  ) {
    this.esdcConfig = config.esdcIntegration;
  }

  /**
   * Process all the available disbursement receipt files in SFTP location.
   * Once the file is processed, it gets deleted.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns Summary details of the processing.
   */
  async process(auditUserId: number): Promise<ProcessSFTPResponseResult[]> {
    // Get the list of all files from SFTP ordered by file name.
    const fileSearch = new RegExp(
      `^${this.esdcConfig.environmentCode}EDU.PBC.DIS.D[\w]*\.[0-9]*`,
      "i",
    );
    const filePaths = await this.integrationService.getResponseFilesFullPath(
      this.esdcConfig.ftpResponseFolder,
      fileSearch,
    );
    const result: ProcessSFTPResponseResult[] = [];
    for (const filePath of filePaths) {
      result.push(await this.processAllReceiptsInFile(filePath, auditUserId));
    }
    return result;
  }

  /**
   * Process a given disbursement receipt file and
   * insert the records to database.
   * @param remoteFilePath file which is to be processed.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns result processing summary.
   */
  private async processAllReceiptsInFile(
    remoteFilePath: string,
    auditUserId: number,
  ): Promise<ProcessSFTPResponseResult> {
    const result = new ProcessSFTPResponseResult();
    result.processSummary.push(`Processing file ${remoteFilePath}.`);
    this.logger.log(`Starting download of file ${remoteFilePath}.`);
    let responseData: DisbursementReceiptDownloadResponse;
    try {
      responseData = await this.integrationService.downloadResponseFile(
        remoteFilePath,
      );
    } catch (error: unknown) {
      this.logger.error(error);
      result.errorsSummary.push(
        `Error downloading file ${remoteFilePath}. Error: ${error}`,
      );
      return result;
    }

    const documentNumbers = responseData.records.map(
      (record) => record.documentNumber,
    );
    const disbursementSchedules =
      await this.disbursementScheduleService.getDisbursementsByDocumentNumbers(
        documentNumbers,
      );
    const disbursementScheduleMap: DisbursementScheduleMap = {};
    disbursementSchedules.forEach(
      (disbursementSchedule) =>
        (disbursementScheduleMap[disbursementSchedule.documentNumber] =
          disbursementSchedule.id),
    );

    this.logger.log(
      "Processing all the records in file with valid data and document number that belongs to SIMS.",
    );

    const createdAt = new Date();
    for (const response of responseData.records) {
      try {
        const invalidDataMessage = response.getInvalidDataMessage();
        if (invalidDataMessage) {
          throw new Error(invalidDataMessage);
        }
        const disbursementScheduleId =
          disbursementScheduleMap[response.documentNumber];
        if (disbursementScheduleId) {
          const generatedIdentifier =
            await this.disbursementReceiptService.insertDisbursementReceipt(
              response,
              responseData.header,
              disbursementScheduleId,
              auditUserId,
              createdAt,
            );
          if (generatedIdentifier) {
            result.processSummary.push(
              `Record with document number ${response.documentNumber} at line ${response.lineNumber} inserted successfully.`,
            );
          } else {
            result.processSummary.push(
              `Record with document number ${response.documentNumber} at line ${response.lineNumber} has been ignored as the receipt already exist.`,
            );
          }
        } else {
          result.processSummary.push(
            `Document number ${response.documentNumber} at line ${response.lineNumber} not found in SIMS.`,
          );
        }
      } catch (error: unknown) {
        this.logger.error(error);
        const logMessage = `Unexpected error while processing disbursement receipt record at line ${response.lineNumber}`;
        result.errorsSummary.push(logMessage);
        this.logger.error(logMessage);
        this.logger.error(error);
      }
    }
    result.processSummary.push(`Processing file ${remoteFilePath} completed.`);
    result.batchRunDate = responseData.header.batchRunDate;
    try {
      //Deleting the file once it has been processed.
      await this.integrationService.deleteFile(remoteFilePath);
    } catch (error) {
      result.errorsSummary.push(
        `Error while deleting disbursement receipt file: ${remoteFilePath}`,
      );
      result.errorsSummary.push(error);
    }
    return result;
  }

  /**
   * 1. Fetches the Daily disbursement information based on the batchRunDate
   * or max date if its not provided.
   * 2. Create a csv file of the total records sent on the process date.
   * 3. Upload the content to the zoneB SFTP server.
   * @param batchRunDate Date in which the daily disbursement records needs to be fetched.
   * @returns Processing Provincial Daily Disbursement request result.
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
      reportName: PROVINCIAL_DAILY_DISBURSEMENT_REPORT_NAME,
      params: { batchRunDate },
    };

    // Fetch the reports data and convert them into CSV.
    const dailyDisbursementsRecordsInCSV =
      await this.reportService.getReportDataAsCSV(reportFilterModel);

    // Create requestFilename with the reportName.
    const remoteFilePath = this.integrationService.createRequestFileName(
      PROVINCIAL_DAILY_DISBURSEMENT_REPORT_NAME,
    );

    const successMessage =
      "Completed sending daily disbursement report via email.";
    try {
      // Send the Daily Disbursement Report content and file via email.
      await this.notificationActionsService.saveProvincialDailyDisbursementReportProcessingNotification(
        remoteFilePath.fileName,
        remoteFilePath.filePath,
      );
    } catch (error: unknown) {
      this.logger.error(error);
      return "Failed to send daily disbursement report via email.";
    }
    return successMessage;

    // Upload the Daily disbursement report content in the SFTP server.
    return this.integrationService.uploadRawContent(
      dailyDisbursementsRecordsInCSV,
      remoteFilePath.filePath,
    );
  }

  @InjectLogger()
  logger: LoggerService;
}
