import { Injectable } from "@nestjs/common";
import { InjectLogger } from "../common";
import { LoggerService } from "../logger/logger.service";
import {
  DownloadResult,
  ProcessSftpResponseResult,
  RecordTypeCodes,
} from "./sfas-integration.models";
import { SFASIntegrationService } from "./sfas-integration.service";
import {
  SFASApplicationService,
  SFASDataImporter,
  SFASIndividualService,
  SFASRestrictionService,
} from "../services";
import { SFAS_IMPORT_RECORDS_PROGRESS_REPORT_PACE } from "../utilities";
import * as os from "os";

@Injectable()
export class SFASIntegrationProcessingService {
  constructor(
    private readonly sfasService: SFASIntegrationService,
    private readonly sfasIndividualService: SFASIndividualService,
    private readonly sfasApplicationService: SFASApplicationService,
    private readonly sfasRestrictionService: SFASRestrictionService,
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

    this.logger.log(`Starting download of file ${filePath}...`);
    try {
      downloadResult = await this.sfasService.downloadResponseFile(filePath);
      this.logger.log("File download finished.");
    } catch (error) {
      this.logger.error(error);
      result.summary.push(
        `Error downloading file ${filePath}. Error: ${error}`,
      );
      result.success = false;
      return result;
    }

    // Used to limit the number of asynchronous operations
    // that will start at the same time.
    const maxPromisesAllowed = os.cpus().length;
    this.logger.log(
      `Starting max ${maxPromisesAllowed} asynchronous processes.`,
    );
    result.summary.push(
      `File contains ${downloadResult.records.length} records.`,
    );
    this.logger.log(`Importing records from file ${filePath}.`);
    this.logger.log(`Total of ${downloadResult.records.length} records.`);

    try {
      let currentRecord = 1;
      // Hold all the promises that must be processed.
      const promises: Promise<void>[] = [];
      for (const record of downloadResult.records) {
        const dataImporter = this.getSFASDataImporterFor(record.recordType);
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

        if (promises.length >= maxPromisesAllowed) {
          // Waits for all be processed or some to fail.
          await Promise.all(promises);
          // Clear the array.
          promises.splice(0, promises.length);
        }

        // Check if it is time to log the current progress.
        if (currentRecord % SFAS_IMPORT_RECORDS_PROGRESS_REPORT_PACE === 0) {
          this.logger.log(
            `Records imported: ${currentRecord} (${Math.round(
              (currentRecord / downloadResult.records.length) * 100,
            )}%)`,
          );
        }

        currentRecord++;
      }
      await Promise.all(promises);
      this.logger.log("Records imported.");

      // Delete the file only if it was processed with success.
      if (result.success) {
        try {
          await this.sfasService.deleteFile(filePath);
        } catch (error) {
          const logMessage = `Error while deleting SFAS integration file: ${filePath}`;
          result.summary.push(logMessage);
          result.success = false;
          this.logger.error(logMessage);
          this.logger.error(error);
        }
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

  /**
   * Define the object responsible to import the SFAS
   * data for the specific record type.
   * @param recordTypeCode type of the record.
   * @returns object responsible to import the SFAS
   * data for the specific record type.
   */
  private getSFASDataImporterFor(
    recordTypeCode: RecordTypeCodes,
  ): SFASDataImporter {
    let dataImporter: SFASDataImporter = undefined;
    switch (recordTypeCode) {
      case RecordTypeCodes.IndividualDataRecord:
        dataImporter = this.sfasIndividualService;
        break;
      case RecordTypeCodes.ApplicationDataRecord:
        dataImporter = this.sfasApplicationService;
        break;
      case RecordTypeCodes.RestrictionDataRecord:
        dataImporter = this.sfasRestrictionService;
        break;
    }
    return dataImporter;
  }

  @InjectLogger()
  logger: LoggerService;
}
