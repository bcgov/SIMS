import { Injectable } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { SFASIndividualService } from "../services";
import { InjectLogger } from "../common";
import { LoggerService } from "../logger/logger.service";
import { SFASRecordIdentification } from "./sfas-files/sfas-record-identification";
import {
  ProcessSftpResponseResult,
  RecordTypeCodes,
} from "./sfas-integration.models";
import { SFASIntegrationService } from "./sfas-integration.service";
import { SFASIndividualRecord } from "./sfas-files/sfas-individual-record";

@Injectable()
export class SFASIntegrationProcessingService {
  constructor(
    private readonly sfasService: SFASIntegrationService,
    private readonly sfasIndividualService: SFASIndividualService,
    private readonly moduleRef: ModuleRef,
  ) {}

  /**
   * Download all files from SFAS integration folder on SFTP and process them all.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  async process(): Promise<ProcessSftpResponseResult[]> {
    const results: ProcessSftpResponseResult[] = [];
    const filePaths = await this.sfasService.getResponseFilesFullPath();
    for (const filePath of filePaths) {
      const result = await this.processFile(filePath);
      results.push(result);
      if (!result.success) {
        break;
      }
    }

    return results;
  }

  /**
   * Process each individual SFAS integration file from the SFTP.
   * @param filePath SFAS integration file to be processed.
   * @returns Process summary and errors summary.
   */
  private async processFile(
    filePath: string,
  ): Promise<ProcessSftpResponseResult> {
    const result = new ProcessSftpResponseResult();
    result.success = true;
    result.summary.push(`Processing file ${filePath}.`);

    let responseFileRecords: SFASRecordIdentification[];

    try {
      responseFileRecords = await this.sfasService.downloadResponseFile(
        filePath,
      );
    } catch (error) {
      this.logger.error(error);
      result.summary.push(
        `Error downloading file ${filePath}. Error: ${error}`,
      );
      result.success = false;
      return result;
    }

    result.summary.push(`File contains ${responseFileRecords.length} records.`);

    try {
      // Hold all the promises that must be processed.
      const promises: Promise<void>[] = [];
      for (const record of responseFileRecords) {
        if (record.recordType === RecordTypeCodes.IndividualDataRecord) {
          const individualRecord = new SFASIndividualRecord(record.line);
          promises.push(
            this.sfasIndividualService
              .saveIndividual(individualRecord)
              .catch((error) => {
                const errorDescription = `Error processing record line number ${record.lineNumber} from file ${filePath}`;
                this.logger.error(`${errorDescription}. Error: ${error}`);
                result.summary.push(errorDescription);
                result.success = false;
              }),
          );
        }
        // const recordTypeName = RecordTypeCodes[record.recordType];
        // if (recordTypeName) {
        //   const processName = `${recordTypeName}Process`;
        //   const process = await this.moduleRef.resolve<SFASProcessBase>(
        //     processName,
        //   );
        //   if (process) {
        //     await process.execute(record);
        //   }
        // }
      }
      // Waits for all be processed or some to fail.
      await Promise.all(promises);

      try {
        //await this.sfasService.deleteFile(filePath);
      } catch (error) {
        const logMessage = `Error while deleting SFAS integration file: ${filePath}`;
        this.logger.error(logMessage);
        result.summary.push(logMessage);
        result.success = false;
      }
    } catch (error) {
      const logMessage = `Error while processing SFAS integration file: ${filePath}`;
      this.logger.error(logMessage);
      result.summary.push(logMessage);
      result.success = false;
    }

    return result;
  }

  @InjectLogger()
  logger: LoggerService;
}
