import { Injectable } from "@nestjs/common";
import {
  LoggerService,
  InjectLogger,
  ProcessSummary,
} from "@sims/utilities/logger";
import { DownloadResult, RecordTypeCodes } from "./sfas-integration.models";
import { SFASIntegrationService } from "./sfas-integration.service";
import {
  SFASApplicationImportService,
  SFASDataImporter,
  SFASIndividualImportService,
  SFASRestrictionImportService,
  SFASPartTimeApplicationsImportService,
  SFASApplicationDependantImportService,
  SFASApplicationDisbursementImportService,
} from "../services/sfas";
import { ConfigService } from "@sims/utilities/config";
import { processInParallel } from "@sims/utilities";
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
    private readonly sfasApplicationDependantImportService: SFASApplicationDependantImportService,
    private readonly sfasApplicationDisbursementImportService: SFASApplicationDisbursementImportService,
    config: ConfigService,
  ) {
    this.ftpReceiveFolder = config.sfasIntegration.ftpReceiveFolder;
  }

  /**
   * Download all files from SFAS integration folder on SFTP and process them all.
   * The files must be processed in the correct order, oldest to newest, and the
   * process will stop if any error is detected, returning the proper log with
   * the file and the line causing the issue.
   * @param processSummary process summary for logging.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  async process(processSummary: ProcessSummary): Promise<void> {
    // Get the list of all files from SFTP ordered by file name.
    const filePaths = await this.sfasService.getResponseFilesFullPath(
      this.ftpReceiveFolder,
      /SFAS-TO-SIMS-[\w]*-[\w]*\.txt/i,
    );
    for (const filePath of filePaths) {
      await this.processFile(filePath, processSummary);
    }
    if (!filePaths.length) {
      processSummary.info(
        "There are no files to be processed, but post-file import operations will be executed.",
      );
    }
    await this.postFileImportOperations(!!filePaths.length, processSummary);
  }

  /**
   * Process each individual SFAS integration file from the SFTP.
   * @param remoteFilePath SFAS integration file to be processed.
   * @param parentProcessSummary process summary for logging.
   * @returns Process summary and errors.
   */
  private async processFile(
    remoteFilePath: string,
    parentProcessSummary: ProcessSummary,
  ): Promise<void> {
    const processSummary = new ProcessSummary();
    parentProcessSummary.children(processSummary);
    processSummary.info(`Processing file ${remoteFilePath}.`);
    let downloadResult: DownloadResult;
    processSummary.info(`Starting download of file ${remoteFilePath}.`);
    try {
      downloadResult = await this.sfasService.downloadResponseFile(
        remoteFilePath,
      );
      processSummary.info("File download finished.");
    } catch (error) {
      throw new Error(`Error downloading file ${remoteFilePath}.`, error);
    }
    processSummary.info(`Starting records import for file ${remoteFilePath}.`);
    // Execute the import of all files records.
    await processInParallel(
      (record) =>
        this.importRecord(
          record,
          downloadResult.header.creationDate,
          processSummary,
        ),
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
    processSummary.info(
      `File contains ${downloadResult.records.length} records.`,
    );
    processSummary.info(`Importing records from file ${remoteFilePath}.`);
    processSummary.info(`Total of ${downloadResult.records.length} records.`);
    processSummary.info("Records imported.");
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

  /**
   * Imports a single record from SFAS into the application.
   * @param record the record to be imported.
   * @param creationDate the date and time when the record was extracted from SFAS.
   * @param processSummary process summary for logging.
   */
  private async importRecord(
    record: SFASRecordIdentification,
    creationDate: Date,
    processSummary: ProcessSummary,
  ): Promise<void> {
    const dataImporter = this.getSFASDataImporterByRecordType(
      record.recordType,
    );
    if (!dataImporter) {
      const warningDescription = `No data importer to process the record type ${record.recordType} at line number ${record.lineNumber}.`;
      this.logger.warn(warningDescription);
      processSummary.warn(warningDescription);
      return;
    }
    try {
      return await dataImporter.importSFASRecord(record, creationDate);
    } catch (error: unknown) {
      const errorDescription = `Error processing record line number ${record.lineNumber}.`;
      this.logger.error(errorDescription, error);
      throw new Error(errorDescription, { cause: error });
    }
  }

  /**
   * Responsible for completing the post file import operations.
   * These include updating the student ids, disbursement overawards
   * and inserting student restrictions.
   * @param executeDisbursementOverawardsUpdate boolean indicating if the disbursement overawards update should execute or not.
   * @param processSummary process summary for logging.
   * @returns postFileImportResult process sftp response result object.
   */
  private async postFileImportOperations(
    executeDisbursementOverawardsUpdate: boolean,
    processSummary: ProcessSummary,
  ): Promise<void> {
    // The following sequence of actions take place after the files have been imported and processed.
    // The steps - updateStudentId and insertStudentRestrictions need to run even if there were 0 files
    // imported and the updateDisbursementOverawards needs to run when there is at least one file imported
    // from SFAS. For instance, after a new student account creation in SIMS and its ministry approval,
    // when the scheduled SFAS integration scheduler runs, even if there are no SFAS files to process,
    // the insertStudentRestrictions method below will run and is responsible for inserting the restrictions
    // for this student previously imported from SFAS.
    try {
      processSummary.info("Updating student ids for SFAS individuals.");
      await this.sfasIndividualImportService.updateStudentId();
      processSummary.info("Student ids updated.");
      // Update the disbursement overawards if there is at least one file to process.
      if (executeDisbursementOverawardsUpdate) {
        processSummary.info(
          "Updating and inserting new disbursement overaward balances from sfas to disbursement overawards table.",
        );
        await this.sfasIndividualImportService.updateDisbursementOverawards();
        processSummary.info(
          "New disbursement overaward balances inserted to disbursement overawards table.",
        );
      }
      processSummary.info(
        "Inserting student restrictions from SFAS restrictions data.",
      );
      await this.sfasRestrictionImportService.insertStudentRestrictions();
      processSummary.info(
        "Inserted student restrictions from SFAS restrictions data.",
      );
    } catch (error) {
      const logMessage =
        "Error while wrapping up post file processing operations.";
      this.logger.error(logMessage, error);
      throw new Error(logMessage, { cause: error });
    }
  }

  /**
   * Define the object responsible to import the SFAS
   * data for the specific record type.
   * @param recordTypeCode type of the record.
   * @returns object responsible to import the SFAS
   * data for the specific record type.
   */
  private getSFASDataImporterByRecordType(
    recordTypeCode: RecordTypeCodes,
  ): SFASDataImporter | null {
    switch (recordTypeCode) {
      case RecordTypeCodes.IndividualDataRecord:
        return this.sfasIndividualImportService;
      case RecordTypeCodes.ApplicationDataRecord:
        return this.sfasApplicationImportService;
      case RecordTypeCodes.RestrictionDataRecord:
        return this.sfasRestrictionImportService;
      case RecordTypeCodes.PartTimeApplicationDataRecord:
        return this.sfasPartTimeApplicationsImportService;
      case RecordTypeCodes.SFASApplicationDependantRecord:
        return this.sfasApplicationDependantImportService;
      case RecordTypeCodes.SFASApplicationDisbursementRecord:
        return this.sfasApplicationDisbursementImportService;
      default:
        return null;
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
