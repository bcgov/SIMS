import { Injectable } from "@nestjs/common";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import {
  DownloadResult,
  ProcessSftpResponseResult,
  RecordTypeCodes,
} from "./sfas-integration.models";
import { SFASIntegrationService } from "./sfas-integration.service";
import {
  SFASApplicationImportService,
  SFASDataImporter,
  SFASIndividualImportService,
  SFASRestrictionImportService,
  SFASPartTimeApplicationsImportService,
} from "../services/sfas";
import { ConfigService } from "@sims/utilities/config";
import { parseJSONError, processInParallel } from "@sims/utilities";
import { SFASRecordIdentification } from "@sims/integrations/sfas-integration/sfas-files/sfas-record-identification";
import { SFAS_IMPORT_RECORDS_PROGRESS_REPORT_PACE } from "@sims/services/constants";

@Injectable()
export class SFASIntegrationProcessingService {
  private readonly ftpReceiveFolder: string;
  constructor(
    private readonly sfasService: SFASIntegrationService,
    private readonly sfasIndividualImportService: SFASIndividualImportService,
    private readonly sfasApplicationImportService: SFASApplicationImportService,
    private readonly sfasRestrictionImportService: SFASRestrictionImportService,
    private readonly sfasPartTimeApplicationsImportService: SFASPartTimeApplicationsImportService,
    config: ConfigService,
  ) {
    this.ftpReceiveFolder = config.sfasIntegration.ftpReceiveFolder;
  }

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
    const filePaths = await this.sfasService.getResponseFilesFullPath(
      this.ftpReceiveFolder,
      /SFAS-TO-SIMS-[\w]*-[\w]*\.txt/i,
    );
    for (const filePath of filePaths) {
      const result = await this.processFile(filePath);
      results.push(result);
      if (!result.success) {
        // It the file has an error, stop the process
        // and allow the results to be returned.
        break;
      }
    }
    const resultPostFileImportOperation = await this.postFileImportOperations(
      !!filePaths.length,
    );
    results.push(resultPostFileImportOperation);
    return results;
  }

  /**
   * Process each individual SFAS integration file from the SFTP.
   * @param remoteFilePath SFAS integration file to be processed.
   * @returns Process summary and errors.
   */
  private async processFile(
    remoteFilePath: string,
  ): Promise<ProcessSftpResponseResult> {
    const result = new ProcessSftpResponseResult();
    result.success = true;
    result.summary.push(`Processing file ${remoteFilePath}.`);

    let downloadResult: DownloadResult;

    this.logger.log(`Starting download of file ${remoteFilePath}...`);
    try {
      downloadResult = await this.sfasService.downloadResponseFile(
        remoteFilePath,
      );
      this.logger.log("File download finished.");
    } catch (error) {
      this.logger.error(error);
      result.summary.push(
        `Error downloading file ${remoteFilePath}. Error: ${error}`,
      );
      result.success = false;
      return result;
    }

    this.logger.log(`Starting records import for file ${remoteFilePath}.`);

    // Execute the import of all files records.
    await processInParallel(
      (record) =>
        this.importRecord(record, downloadResult.header.creationDate, result),
      downloadResult.records,
      {
        progress: (currentRecord: number) => {
          // Check if it is time to log the current progress.
          if (currentRecord % SFAS_IMPORT_RECORDS_PROGRESS_REPORT_PACE === 0) {
            this.logger.log(
              `Records imported: ${currentRecord} (${Math.round(
                (currentRecord / downloadResult.records.length) * 100,
              )}%)`,
            );
          }
        },
      },
    );

    result.summary.push(
      `File contains ${downloadResult.records.length} records.`,
    );
    this.logger.log(`Importing records from file ${remoteFilePath}.`);
    this.logger.log(`Total of ${downloadResult.records.length} records.`);

    try {
      this.logger.log("Records imported.");
      if (result.success) {
        // Archive the file only if it was processed with success.
        try {
          await this.sfasService.archiveFile(remoteFilePath);
        } catch (error) {
          throw new Error(
            `Error while archiving SFAS integration file: ${remoteFilePath}`,
            {
              cause: error,
            },
          );
        }
      }
    } catch (error) {
      result.success = false;
      const logMessage = `Error while processing SFAS integration file: ${remoteFilePath}`;
      result.summary.push(logMessage);
      result.summary.push(parseJSONError(error));
      this.logger.error(logMessage, error);
    }

    return result;
  }

  /**
   * Imports a single record from SFAS into the application.
   * The record is determined by the recordType and the import process
   * is done by the data importer retrieved by
   * getSFASDataImporterFor.
   * @param record the record to be imported.
   * @param creationDate the date and time when the record was extracted from SFAS.
   * @param result the process sftp response result object to store the result of the import process.
   */
  private async importRecord(
    record: SFASRecordIdentification,
    creationDate: Date,
    result: ProcessSftpResponseResult,
  ): Promise<void> {
    const dataImporter = this.getSFASDataImporterFor(record.recordType);
    if (!dataImporter) {
      const errorDescription = `No data importer to process line number ${record.lineNumber}.`;
      this.logger.error(errorDescription);
      result.summary.push(errorDescription);
      result.success = false;
    }
    try {
      return await dataImporter.importSFASRecord(record, creationDate);
    } catch (error: unknown) {
      const errorDescription = `Error processing record line number ${record.lineNumber}.`;
      result.summary.push(errorDescription);
      result.summary.push(parseJSONError(error));
      this.logger.error(errorDescription, error);
      result.success = false;
    }
  }

  /**
   * Responsible for completing the post file import operations.
   * These include updating the student ids, disbursement overawards
   * and inserting student restrictions.
   * @param executeDisbursementOverawardsUpdate boolean indicating if the disbursement overawards update should execute or not.
   * @returns postFileImportResult process sftp response result object.
   */
  private async postFileImportOperations(
    executeDisbursementOverawardsUpdate: boolean,
  ): Promise<ProcessSftpResponseResult> {
    // The following sequence of actions take place after the files have been imported and processed.
    // The steps - updateStudentId and insertStudentRestrictions need to run even if there were 0 files
    // imported and the updateDisbursementOverawards needs to run when there is atleast one file imported
    // from SFAS. For instance, after a new student account creation in SIMS and its ministry approval,
    // when the scheduled SFAS integration scheduler runs, even if there are no SFAS files to process,
    // the insertStudentRestrictions method below will run and is responsible for inserting the restrictions
    // for this student previously imported from SFAS.
    const postFileImportResult = new ProcessSftpResponseResult();
    try {
      postFileImportResult.summary.push(
        "Updating student ids for SFAS individuals.",
      );
      await this.sfasIndividualImportService.updateStudentId();
      postFileImportResult.summary.push("Student ids updated.");
      // Update the disbursement overawards if there is atleast one file to process.
      if (executeDisbursementOverawardsUpdate) {
        postFileImportResult.summary.push(
          "Updating and inserting new disbursement overaward balances from sfas to disbursement overawards table.",
        );
        await this.sfasIndividualImportService.updateDisbursementOverawards();
        postFileImportResult.summary.push(
          "New disbursement overaward balances inserted to disbursement overawards table.",
        );
      }
      postFileImportResult.summary.push(
        "Inserting student restrictions from SFAS restrictions data.",
      );
      await this.sfasRestrictionImportService.insertStudentRestrictions();
      postFileImportResult.summary.push(
        "Inserted student restrictions from SFAS restrictions data.",
      );
      postFileImportResult.success = true;
    } catch (error) {
      const logMessage =
        "Error while wrapping up post file processing operations.";
      postFileImportResult.success = false;
      postFileImportResult.summary.push(logMessage);
      postFileImportResult.summary.push(parseJSONError(error));
      this.logger.error(logMessage, error);
    }
    return postFileImportResult;
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
        dataImporter = this.sfasIndividualImportService;
        break;
      case RecordTypeCodes.ApplicationDataRecord:
        dataImporter = this.sfasApplicationImportService;
        break;
      case RecordTypeCodes.RestrictionDataRecord:
        dataImporter = this.sfasRestrictionImportService;
        break;
      case RecordTypeCodes.PartTimeApplicationDataRecord:
        dataImporter = this.sfasPartTimeApplicationsImportService;
        break;
    }
    return dataImporter;
  }

  @InjectLogger()
  logger: LoggerService;
}
