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
import { DAILY_DISBURSEMENT_REPORT_NAME } from "@sims/services/constants";
import { getISODateOnlyString, parseJSONError } from "@sims/utilities";

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
   * Once the file is processed, it gets archived.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns Summary details of the processing.
   */
  async process(auditUserId: number): Promise<ProcessSFTPResponseResult[]> {
    // Get the list of all files from SFTP ordered by file name.
    const fileSearch = new RegExp(
      `^${this.esdcConfig.environmentCode}EDU\\.PBC\\.DIS.[0-9]{8}\\.[0-9]{3}$`,
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

    await this.processSendingFile(
      result,
      responseData.header.fileDate,
      responseData.header.sequenceNumber,
    );

    try {
      // Archiving the file once it has been processed.
      await this.integrationService.archiveFile(remoteFilePath);
    } catch (error) {
      const logMessage = `Unexpected error while archiving disbursement receipt file: ${remoteFilePath}.`;
      result.errorsSummary.push(logMessage);
      result.errorsSummary.push(parseJSONError(error));
      this.logger.error(logMessage, error);
    }
    return result;
  }

  /**
   * Create a provincial daily disbursement CSV file and
   * email the content to the ministry users.
   * @param result output of the processing steps.
   * @param fileDate File date to be a part of filename.
   * @param sequenceNumber Sequence number to be a part of filename.
   */
  private async processSendingFile(
    result: ProcessSFTPResponseResult,
    fileDate: Date,
    sequenceNumber: number,
  ): Promise<void> {
    result.processSummary.push(
      `Processing provincial daily disbursement CSV file on ${getISODateOnlyString(
        fileDate,
      )}.`,
    );

    try {
      // Populate the reportName and fileDate and sequenceNumber to the reportsFilterMode.
      const reportFilterModel: ReportsFilterModel = {
        reportName: DAILY_DISBURSEMENT_REPORT_NAME,
        params: {
          fileDate,
          sequenceNumber,
        },
      };

      // Fetch the reports data and convert them into CSV.
      const dailyDisbursementsRecordsInCSV =
        await this.reportService.getReportDataAsCSV(reportFilterModel);

      if (dailyDisbursementsRecordsInCSV === "") {
        return;
      }

      // Create the file name for the daily disbursement report.
      const disbursementFileName =
        this.integrationService.createDisbursementFileName(
          DAILY_DISBURSEMENT_REPORT_NAME,
          fileDate,
          sequenceNumber,
        );

      // Send the Daily Disbursement Report content and file via email.
      await this.notificationActionsService.saveProvincialDailyDisbursementReportProcessingNotification(
        {
          attachmentFileContent: dailyDisbursementsRecordsInCSV,
          fileName: disbursementFileName,
        },
      );
      result.processSummary.push(
        "Provincial daily disbursement CSV report generated.",
      );
      this.logger.log(
        "Completed provincial daily disbursement report generation.",
      );
    } catch (error) {
      this.logger.error(error);
      result.errorsSummary.push(
        "Error while generating provincial daily disbursement CSV report file.",
      );
      result.errorsSummary.push(error);
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
