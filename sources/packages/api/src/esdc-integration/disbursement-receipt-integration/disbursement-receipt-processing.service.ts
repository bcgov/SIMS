import { Injectable } from "@nestjs/common";
import {
  DisbursementReceipt,
  DisbursementReceiptValue,
  DisbursementSchedule,
  User,
} from "../../database/entities";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import {
  ConfigService,
  DisbursementScheduleService,
  DisbursementReceiptService,
} from "../../services";
import { ESDCIntegrationConfig } from "../../types";
import { DisbursementReceiptIntegrationService } from "./disbursement-receipt-integration.service";
import { ProcessSFTPResponseResult } from "../models/esdc-integration.model";
import { DisbursementReceiptDownloadResponse } from "./models/disbursement-receipt-integration.model";

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
    this.esdcConfig = config.getConfig().ESDCIntegration;
  }

  /**
   * Process all the available disbursement receipt files in SFTP location.
   * Once the file is processed, it gets deleted.
   * @param auditUserId
   * @returns Summary details of the processing.
   */
  async process(auditUserId: number): Promise<ProcessSFTPResponseResult> {
    const result = new ProcessSFTPResponseResult();

    // Get the list of all files from SFTP ordered by file name.
    const fileSearch = new RegExp(
      `^${this.esdcConfig.environmentCode}EDU.PBC.DIS.D[\w]*\.[0-9]*`,
      "i",
    );
    const filePaths = await this.integrationService.getResponseFilesFullPath(
      this.esdcConfig.ftpResponseFolder,
      fileSearch,
    );
    if (filePaths.length === 0) {
      result.processSummary.push(
        "No files found to be processed at this time.",
      );
      return result;
    }
    for (const filePath of filePaths) {
      await this.processAllReceiptsInFile(filePath, auditUserId, result);

      try {
        //Deleting the file once it has been processed.
        await this.integrationService.deleteFile(filePath);
      } catch (error) {
        result.errorsSummary.push(
          `Error while deleting disbursement receipt file: ${filePath}`,
        );
        result.errorsSummary.push(error);
      }
    }
    return result;
  }
  /**
   *
   * @param remoteFilePath file which is to be processed.
   * @param auditUserId user id of API user.
   * @param result processing summary.
   */
  private async processAllReceiptsInFile(
    remoteFilePath: string,
    auditUserId: number,
    result: ProcessSFTPResponseResult,
  ): Promise<void> {
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
      return;
    }

    const documentNumbers = responseData.records.map(
      (record) => record.documentNumber,
    );
    const disbursementSchedules =
      await this.disbursementScheduleService.getDisbursementsByDocumentNumbers(
        documentNumbers,
      );
    const disbursementScheduleMap = {};
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
      const disbursementScheduleId =
        disbursementScheduleMap[response.documentNumber];
      if (disbursementScheduleId) {
        const disbursementReceipt = new DisbursementReceipt();
        disbursementReceipt.batchRunDate = responseData.header.batchRunDate;
        disbursementReceipt.studentSIN = response.studentSIN;
        disbursementReceipt.disbursementSchedule = {
          id: disbursementScheduleId,
        } as DisbursementSchedule;
        disbursementReceipt.fundingType = response.fundingType;
        disbursementReceipt.totalEntitledDisbursedAmount =
          response.totalEntitledDisbursedAmount;
        disbursementReceipt.totalDisbursedAmount =
          response.totalDisbursedAmount;
        disbursementReceipt.disburseDate = response.disburseDate;
        disbursementReceipt.disburseAmountStudent =
          response.disburseAmountStudent;
        disbursementReceipt.disburseAmountInstitution =
          response.disburseAmountInstitution;
        disbursementReceipt.dateSignedInstitution =
          response.dateSignedInstitution;
        disbursementReceipt.institutionCode = response.institutionCode;
        disbursementReceipt.disburseMethodStudent =
          response.disburseMethodStudent;
        disbursementReceipt.studyPeriodEndDate = response.studyPeriodEndDate;
        disbursementReceipt.totalEntitledGrantAmount =
          response.totalEntitledGrantAmount;
        disbursementReceipt.totalDisbursedGrantAmount =
          response.totalDisbursedGrantAmount;
        disbursementReceipt.totalDisbursedGrantAmountStudent =
          response.totalDisbursedGrantAmountStudent;
        disbursementReceipt.totalDisbursedGrantAmountInstitution =
          response.totalDisbursedGrantAmountInstitution;
        disbursementReceipt.creator = { id: auditUserId } as User;
        disbursementReceipt.createdAt = createdAt;
        disbursementReceipt.disbursementReceiptValues = response.grants.map(
          (grant) => {
            const disbursementReceiptValue = new DisbursementReceiptValue();
            disbursementReceiptValue.grantType = grant.grantType;
            disbursementReceiptValue.grantAmount = grant.grantAmount;
            disbursementReceiptValue.creator = { id: auditUserId } as User;
            disbursementReceiptValue.createdAt = createdAt;
            return disbursementReceiptValue;
          },
        );
        try {
          const invalidDataMessage = response.getInvalidDataMessage();
          if (invalidDataMessage) {
            throw new Error(invalidDataMessage);
          }
          await this.disbursementReceiptService.insertDisbursementReceipt(
            disbursementReceipt,
          );
        } catch (error: unknown) {
          this.logger.error(error);
          const logMessage = `Unexpected error while processing disbursement receipt record at line ${response.lineNumber}`;
          result.errorsSummary.push(logMessage);
          this.logger.error(logMessage);
          this.logger.error(error);
        }
      }
    }
    result.processSummary.push(`Processing file ${remoteFilePath} completed.`);
  }

  @InjectLogger()
  logger: LoggerService;
}
