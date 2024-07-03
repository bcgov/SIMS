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

  @InjectLogger()
  logger: LoggerService;
}
