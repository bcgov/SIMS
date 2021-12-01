import { Injectable, LoggerService } from "@nestjs/common";
import { InjectLogger } from "../../common";
import {
  DisbursementScheduleErrorsService,
  DisbursementScheduleService,
} from "../../services";
import { ProcessSftpResponseResult } from "./models/e-cert-full-time-integration.model";
import { ECertFullTimeIntegrationService } from "./e-cert-full-time-integration.service";
import { ECertResponseRecord } from "./e-cert-files/e-cert-response-record";
import { getUTCNow } from "../../utilities";

@Injectable()
export class ECertFullTimeResponseService {
  constructor(
    private readonly disbursementScheduleService: DisbursementScheduleService,
    private readonly eCertFullTimeService: ECertFullTimeIntegrationService,
    private readonly disbursementScheduleErrorsService: DisbursementScheduleErrorsService,
  ) {}
  /**
   * Download all files from E-Cert Response folder on SFTP and process them all.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  async processResponses(): Promise<ProcessSftpResponseResult[]> {
    const filePaths =
      await this.eCertFullTimeService.getResponseFilesFullPath();
    const processFiles: ProcessSftpResponseResult[] = [];
    for (const filePath of filePaths) {
      processFiles.push(await this.processFile(filePath));
    }
    return processFiles;
  }

  /**
   * Process each individual E-Cert response file from the SFTP.
   * @param filePath E-Cert response file to be processed.
   * @returns Process summary and errors summary.
   */
  private async processFile(
    filePath: string,
  ): Promise<ProcessSftpResponseResult> {
    const result = new ProcessSftpResponseResult();
    result.processSummary.push(`Processing file ${filePath}.`);

    let responseFile: ECertResponseRecord[];

    try {
      responseFile = await this.eCertFullTimeService.downloadResponseFile(
        filePath,
      );
    } catch (error) {
      this.logger.error(error);
      result.errorsSummary.push(`Error downloading file ${filePath}. ${error}`);
      // Abort the process nicely not throwing an exception and
      // allowing other response files to be processed.
      return result;
    }

    result.processSummary.push(`File contains ${responseFile.length} records.`);

    for (const feedbackRecord of responseFile) {
      try {
        await this.processErrorCodeRecords(feedbackRecord);
        result.processSummary.push(
          `Status record from line ${feedbackRecord.lineNumber}.`,
        );
      } catch (error) {
        // Log the error but allow the process to continue.
        const errorDescription = `Error processing record line number ${
          feedbackRecord.lineNumber + 1
        } from file ${filePath}, error: ${error}`;
        result.errorsSummary.push(errorDescription);
        this.logger.error(`${errorDescription}. Error: ${error}`);
      }
    }

    try {
      if (!(result.errorsSummary.length > 0)) {
        // if there is an error in the file do not delete the file
        await this.eCertFullTimeService.deleteFile(filePath);
      }
    } catch (error) {
      // Log the error but allow the process to continue.
      // If there was an issue only during the file removal, it will be
      // processed again and could be deleted in the second attempt.
      const logMessage = `Error while deleting E-Cert response file: ${filePath}`;
      this.logger.error(logMessage);
      result.errorsSummary.push(logMessage);
    }

    return result;
  }

  /**
   * Process the feedback record of the E-Cert response file
   * by updating database
   * @param feedbackRecord E-Cert received record with
   */
  private async processErrorCodeRecords(
    feedbackRecord: ECertResponseRecord,
  ): Promise<void> {
    const now = getUTCNow();
    const disbursementSchedule =
      await this.disbursementScheduleService.getDisbursementScheduleByDocumentNumber(
        feedbackRecord.documentNumber,
      );
    const errorList = [];
    if (disbursementSchedule) {
      [
        feedbackRecord.errorCode1,
        feedbackRecord.errorCode2,
        feedbackRecord.errorCode3,
        feedbackRecord.errorCode4,
        feedbackRecord.errorCode5,
      ].forEach(async (errorCode) => {
        if (errorCode) {
          const updateResult =
            await this.disbursementScheduleErrorsService.createECertErrorRecord(
              disbursementSchedule,
              errorCode,
              now,
            );
          // Expected to update 1 and only 1 record.
          if (!updateResult) {
            errorList.push(
              `Error while saving Error Code: ${errorCode} for document number:${feedbackRecord.documentNumber} , expected 1.`,
            );
          }
        }
      });
    } else {
      throw new Error(
        `${feedbackRecord.documentNumber} document number not found in disbursement_schedule table.`,
      );
    }

    // Expected to update 1 and only 1 record.
    if (errorList.length > 0) {
      throw new Error(
        `Error while saving Error codes to the table ${errorList}.`,
      );
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
