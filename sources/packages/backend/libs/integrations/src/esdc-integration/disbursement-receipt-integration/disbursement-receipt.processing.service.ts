import { Injectable } from "@nestjs/common";
import {
  LoggerService,
  InjectLogger,
  ProcessSummary,
} from "@sims/utilities/logger";
import { DisbursementReceiptIntegrationService } from "./disbursement-receipt.integration.service";
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
  SystemUsersService,
} from "@sims/services";
import { DAILY_DISBURSEMENT_REPORT_NAME } from "@sims/services/constants";
import { getISODateOnlyString } from "@sims/utilities";

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
    private readonly systemUsersService: SystemUsersService,
  ) {
    this.esdcConfig = config.esdcIntegration;
  }

  /**
   * Process all the available disbursement receipt files in SFTP location.
   * Once the file is processed, it gets archived.
   * @param processSummary process summary for logging.
   * @returns Summary details of the processing.
   */
  async process(processSummary: ProcessSummary): Promise<void> {
    // Get the list of all files from SFTP ordered by file name.
    const fileSearch = new RegExp(
      `^${this.esdcConfig.environmentCode}EDU\\.PBC\\.DIS.[0-9]{8}\\.[0-9]{3}$`,
      "i",
    );
    const filePaths = await this.integrationService.getResponseFilesFullPath(
      this.esdcConfig.ftpResponseFolder,
      fileSearch,
    );
    if (!filePaths) {
      processSummary.error(
        "There are no disbursement receipt files to be processed.",
      );
      return;
    }
    for (const filePath of filePaths) {
      const fileProcessSummary = new ProcessSummary();
      processSummary.children(fileProcessSummary);
      await this.processAllReceiptsInFile(filePath, fileProcessSummary);
    }
  }

  /**
   * Process a given disbursement receipt file and
   * insert the records to database.
   * @param remoteFilePath file which is to be processed.
   * @param processSummary process summary for logging.
   * @returns result processing summary.
   */
  private async processAllReceiptsInFile(
    remoteFilePath: string,
    processSummary: ProcessSummary,
  ): Promise<void> {
    processSummary.info(`Processing file ${remoteFilePath}.`);
    let responseData: DisbursementReceiptDownloadResponse;
    try {
      responseData = await this.integrationService.downloadResponseFile(
        remoteFilePath,
      );
    } catch (error: unknown) {
      this.logger.error(error);
      processSummary.error(`Error downloading file ${remoteFilePath}.`, error);
      return;
    }
    // File download is successful, import the receipts.
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

    processSummary.info(
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
              this.systemUsersService.systemUser.id,
              createdAt,
            );
          if (generatedIdentifier) {
            processSummary.info(
              `Record with document number ${response.documentNumber} at line ${response.lineNumber} inserted successfully.`,
            );
          } else {
            processSummary.info(
              `Record with document number ${response.documentNumber} at line ${response.lineNumber} has been ignored as the receipt already exist.`,
            );
          }
        } else {
          processSummary.info(
            `Document number ${response.documentNumber} at line ${response.lineNumber} not found in SIMS.`,
          );
        }
      } catch (error: unknown) {
        const logMessage = `Unexpected error while processing disbursement receipt record at line ${response.lineNumber}`;
        this.logger.error(logMessage, error);
        processSummary.error(logMessage, error);
      }
    }
    processSummary.info(`Processing file ${remoteFilePath} completed.`);

    await this.processSendingFile(
      responseData.header.fileDate,
      responseData.header.sequenceNumber,
      processSummary,
    );

    try {
      // Archiving the file once it has been processed.
      await this.integrationService.archiveFile(remoteFilePath);
    } catch (error) {
      const logMessage = `Unexpected error while archiving disbursement receipt file: ${remoteFilePath}.`;
      this.logger.error(logMessage, error);
      processSummary.error(logMessage, error);
    }
  }

  /**
   * Create a provincial daily disbursement CSV file and
   * email the content to the ministry users.
   * @param processSummary process summary for logging.
   * @param fileDate File date to be a part of filename.
   * @param sequenceNumber Sequence number to be a part of filename.
   */
  private async processSendingFile(
    fileDate: Date,
    sequenceNumber: number,
    processSummary: ProcessSummary,
  ): Promise<void> {
    processSummary.info(
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
      processSummary.info(
        "Provincial daily disbursement CSV report generated.",
      );
    } catch (error: unknown) {
      const errorMessage =
        "Error while generating provincial daily disbursement CSV report file.";
      this.logger.error(errorMessage, error);
      processSummary.error(errorMessage, error);
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
