import { Injectable } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { InjectLogger } from "../common";
import { LoggerService } from "../logger/logger.service";
import { SFASProcessBase } from "./processes/sfas-process-base";
import { SFASRecordIdentification } from "./sfas-files/sfas-record-identification";
import {
  ProcessSftpResponseResult,
  RecordTypeCodes,
} from "./sfas-integration.models";
import { SFASIntegrationService } from "./sfas-integration.service";

@Injectable()
export class SFASIntegrationProcessingService {
  constructor(
    private readonly sfasService: SFASIntegrationService,
    private readonly moduleRef: ModuleRef,
  ) {}

  /**
   * Download all files from SFAS integration folder on SFTP and process them all.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  async process(): Promise<void> {
    const filePaths = await this.sfasService.getResponseFilesFullPath();
    for (const filePath of filePaths) {
      await this.processFile(filePath);
    }
  }

  /**
   * Process each individual SFAS integration file from the SFTP.
   * @param filePath SFAS integration file to be processed.
   * @returns Process summary and errors summary.
   */
  private async processFile(
    filePath: string,
  ): Promise<ProcessSftpResponseResult> {
    //const now = getUTCNow();
    const result = new ProcessSftpResponseResult();
    result.processSummary.push(`Processing file ${filePath}.`);

    let responseFileRecords: SFASRecordIdentification[];

    try {
      responseFileRecords = await this.sfasService.downloadResponseFile(
        filePath,
      );
    } catch (error) {
      this.logger.error(error);
      result.errorsSummary.push(
        `Error downloading file ${filePath}. Error: ${error}`,
      );
      // Abort the process nicely not throwing an exception and
      // allowing other response files to be processed.
      return;
    }

    result.processSummary.push(
      `File contains ${responseFileRecords.length} records.`,
    );

    for (const record of responseFileRecords) {
      try {
        const recordTypeName = RecordTypeCodes[record.recordType];
        if (recordTypeName) {
          const processName = `${recordTypeName}Process`;
          const process = this.moduleRef.get<SFASProcessBase>(processName);
          if (process) {
            await process.execute(record);
          }
        }
      } catch (error) {
        // Log the error but allow the process to continue.
        const errorDescription = `Error processing record line number ${record.lineNumber} from file ${filePath}`;
        result.errorsSummary.push(errorDescription);
        this.logger.error(`${errorDescription}. Error: ${error}`);
      }
    }

    try {
      //await this.sfasService.deleteFile(filePath);
    } catch (error) {
      // Log the error but allow the process to continue.
      // If there was an issue only during the file removal, it will be
      // processed again and could be deleted in the second attempt.
      const logMessage = `Error while deleting CRA response file: ${filePath}`;
      this.logger.error(logMessage);
      result.errorsSummary.push(logMessage);
    }

    return result;
  }

  @InjectLogger()
  logger: LoggerService;
}
