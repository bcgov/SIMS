import { Injectable } from "@nestjs/common";
import { validate } from "class-validator";
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
 * Manages the process to import the entire snapshot of federal
 * restrictions, that is received daily, and update the students
 * restrictions, adding and deactivating accordingly.
 * * This process does not affect provincial restrictions.
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
    }
    return result;
  }

  private async processAllReceiptsInFile(
    remoteFilePath: string,
    auditUserId: number,
    result: ProcessSFTPResponseResult,
  ) {
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
          const validationErrors = await validate(disbursementReceipt);
          if (validationErrors.length > 0) {
            const errorDescription = validationErrors
              .map((error) => error.property)
              .join(", ");
            const errorMessage = `Found record with invalid data for the properties ${errorDescription}`;
            throw new Error(errorMessage);
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
