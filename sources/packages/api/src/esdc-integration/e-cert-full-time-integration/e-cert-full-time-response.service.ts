import { Injectable, LoggerService } from "@nestjs/common";
import { InjectLogger } from "../../common";
import {
  DisbursementScheduleErrorsService,
  DisbursementScheduleService,
  ConfigService,
} from "../../services";
import { ProcessSFTPResponseResult } from "../models/esdc-integration.model";
import { ECertFullTimeIntegrationService } from "./e-cert-full-time-integration.service";
import { ECertResponseRecord } from "./e-cert-files/e-cert-response-record";
import { getUTCNow } from "../../utilities";
import { ESDCIntegrationConfig } from "../../types";

@Injectable()
export class ECertFullTimeResponseService {
  private readonly esdcConfig: ESDCIntegrationConfig;

  constructor(
    config: ConfigService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
    private readonly eCertFullTimeService: ECertFullTimeIntegrationService,
    private readonly disbursementScheduleErrorsService: DisbursementScheduleErrorsService,
  ) {
    this.esdcConfig = config.getConfig().ESDCIntegration;
  }

  /**
   * Download all files from E-Cert Response folder on SFTP and process them all.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  async processResponses(): Promise<ProcessSFTPResponseResult[]> {
    const filePaths = await this.eCertFullTimeService.getResponseFilesFullPath(
      this.esdcConfig.ftpResponseFolder,
      new RegExp(
        `^${this.esdcConfig.environmentCode}EDU.PBC.CERTSFB.*\\.DAT`,
        "i",
      ),
    );
    const processFiles: ProcessSFTPResponseResult[] = [];
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
  ): Promise<ProcessSFTPResponseResult> {
    const result = new ProcessSFTPResponseResult();
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
        this.logger.error(
          `Successfully processed line ${feedbackRecord.lineNumber}.`,
        );
      } catch (error) {
        // Log the error but allow the process to continue.
        const errorDescription = `Error processing record line number ${feedbackRecord.lineNumber} from file ${filePath}, error: ${error}`;
        result.errorsSummary.push(errorDescription);
        this.logger.error(`${errorDescription}. Error: ${error}`);
      }
    }

    try {
      if (result.errorsSummary.length === 0) {
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
   * Process the feedback record from the E-Cert response file
   * and save the error code and disbursementSchedule_id respective to
   * the document number in DisbursementFeedbackErrors.
   * @param feedbackRecord E-Cert received record
   */
  private async processErrorCodeRecords(
    feedbackRecord: ECertResponseRecord,
  ): Promise<void> {
    const now = getUTCNow();
    const disbursementSchedule =
      await this.disbursementScheduleService.getDisbursementScheduleByDocumentNumber(
        feedbackRecord.documentNumber,
      );
    if (disbursementSchedule) {
      await this.disbursementScheduleErrorsService.createECertErrorRecord(
        disbursementSchedule,
        [
          feedbackRecord.errorCode1,
          feedbackRecord.errorCode2,
          feedbackRecord.errorCode3,
          feedbackRecord.errorCode4,
          feedbackRecord.errorCode5,
        ].filter((error) => error),
        now,
      );
    } else {
      throw new Error(
        `${feedbackRecord.documentNumber} document number not found in disbursement_schedule table.`,
      );
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
