import { Injectable } from "@nestjs/common";
import { InjectLogger } from "../common";
import { LoggerService } from "../logger/logger.service";
import {
  DownloadResult,
  ProcessSftpResponseResult,
  RecordTypeCodes,
} from "./sfas-integration.models";
import { SFASIntegrationService } from "./sfas-integration.service";
import { SFASDataImporter, SFASIndividualService } from "../services";

@Injectable()
export class SFASIntegrationProcessingService {
  constructor(
    private readonly sfasService: SFASIntegrationService,
    private readonly sfasIndividualService: SFASIndividualService,
  ) {}

  /**
   * Download all files from SFAS integration folder on SFTP and process them all.
   * The files must be processed in the correct order, oldest to newest, and the
   * process will stop if any error is detected, returning the proper log with
   * the file and the line causing the issue.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  async process(): Promise<ProcessSftpResponseResult[]> {
    const results: ProcessSftpResponseResult[] = [];
    // Get the list of all files from SFTP ordered by file name.
    const filePaths = await this.sfasService.getResponseFilesFullPath();
    for (const filePath of filePaths) {
      const result = await this.processFile(filePath);
      results.push(result);
      if (!result.success) {
        // It the file has an error, stop the process
        // and allow the results to be returned.
        break;
      }
    }

    return results;
  }

  /**
   * Process each individual SFAS integration file from the SFTP.
   * @param filePath SFAS integration file to be processed.
   * @returns Process summary and errors.
   */
  private async processFile(
    filePath: string,
  ): Promise<ProcessSftpResponseResult> {
    const result = new ProcessSftpResponseResult();
    result.success = true;
    result.summary.push(`Processing file ${filePath}.`);

    let downloadResult: DownloadResult;

    try {
      downloadResult = await this.sfasService.downloadResponseFile(filePath);
    } catch (error) {
      this.logger.error(error);
      result.summary.push(
        `Error downloading file ${filePath}. Error: ${error}`,
      );
      result.success = false;
      return result;
    }

    result.summary.push(
      `File contains ${downloadResult.records.length} records.`,
    );
    try {
      // Hold all the promises that must be processed.
      const promises: Promise<void>[] = [];
      for (const record of downloadResult.records) {
        let dataImporter: SFASDataImporter;
        switch (record.recordType) {
          case RecordTypeCodes.IndividualDataRecord:
            dataImporter = this.sfasIndividualService;
            break;
        }

        if (dataImporter) {
          const processPromise = dataImporter
            .importSFASRecord(record, downloadResult.header.creationDate)
            .catch((error) => {
              const errorDescription = `Error processing record line number ${record.lineNumber}`;
              this.logger.error(errorDescription);
              this.logger.error(error);
              result.summary.push(errorDescription);
              result.success = false;
            });
          promises.push(processPromise);
        }
      }
      // Waits for all be processed or some to fail.
      await Promise.all(promises);

      try {
        //await this.sfasService.deleteFile(filePath);
      } catch (error) {
        const logMessage = `Error while deleting SFAS integration file: ${filePath}`;
        result.summary.push(logMessage);
        result.success = false;
        this.logger.error(logMessage);
        this.logger.error(error);
      }
    } catch (error) {
      const logMessage = `Error while processing SFAS integration file: ${filePath}`;
      result.summary.push(logMessage);
      result.success = false;
      this.logger.error(logMessage);
      this.logger.error(error);
    }

    return result;
  }

  @InjectLogger()
  logger: LoggerService;
}
