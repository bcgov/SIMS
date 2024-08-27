import { Injectable } from "@nestjs/common";
import { MSFAANumberService } from "@sims/integrations/services";
import { OfferingIntensity } from "@sims/sims-db";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { ProcessSFTPResponseResult } from "../models/esdc-integration.model";
import {
  MSFAASFTPResponseFile,
  ReceivedStatusCode,
} from "./models/msfaa-integration.model";
import { MSFAAResponseCancelledRecord } from "./msfaa-files/msfaa-response-cancelled-record";
import { MSFAAResponseReceivedRecord } from "./msfaa-files/msfaa-response-received-record";
import { MSFAAIntegrationService } from "./msfaa.integration.service";
import { SFTP_ARCHIVE_DIRECTORY } from "@sims/utilities";
import * as path from "path";

@Injectable()
export class MSFAAResponseProcessingService {
  constructor(
    private readonly msfaaNumberService: MSFAANumberService,
    private readonly msfaaService: MSFAAIntegrationService,
  ) {}
  /**
   * Download all files from MSFAA Response folder on SFTP and process them all.
   * @param offeringIntensity offering intensity.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  async processResponses(
    offeringIntensity: OfferingIntensity,
  ): Promise<ProcessSFTPResponseResult[]> {
    const filePaths = await this.msfaaService.getResponseFilesFullPath(
      offeringIntensity,
    );
    const processFiles: ProcessSFTPResponseResult[] = [];
    for (const filePath of filePaths) {
      processFiles.push(await this.processFile(filePath));
    }
    return processFiles;
  }

  /**
   * Process each individual MSFAA response file from the SFTP.
   * @param filePath MSFAA response file to be processed.
   * @returns Process summary and errors summary.
   */
  private async processFile(
    filePath: string,
  ): Promise<ProcessSFTPResponseResult> {
    const result = new ProcessSFTPResponseResult();
    result.processSummary.push(`Processing file ${filePath}.`);

    let responseFile: MSFAASFTPResponseFile;

    try {
      responseFile = await this.msfaaService.downloadResponseFile(filePath);
    } catch (error) {
      this.logger.error(error);
      result.errorsSummary.push(`Error downloading file ${filePath}. ${error}`);
      // Abort the process nicely not throwing an exception and
      // allowing other response files to be processed.
      return result;
    }

    result.processSummary.push("File contains:");
    result.processSummary.push(
      `Confirmed MSFAA records (type ${ReceivedStatusCode.Received}): ${responseFile.receivedRecords.length}.`,
    );
    result.processSummary.push(
      `Cancelled MSFAA records (type ${ReceivedStatusCode.Cancelled}): ${responseFile.cancelledRecords.length}.`,
    );

    for (const receivedRecord of responseFile.receivedRecords) {
      try {
        await this.processReceivedRecord(receivedRecord);
        result.processSummary.push(
          `Record from line ${receivedRecord.lineNumber}, updated as confirmed.`,
        );
      } catch (error) {
        // Log the error but allow the process to continue.
        const errorDescription = `Error processing record line number ${receivedRecord.lineNumber} from file ${responseFile.filePath}`;
        result.errorsSummary.push(errorDescription);
        this.logger.error(`${errorDescription}. Error: ${error}`);
      }
    }
    for (const cancelledRecord of responseFile.cancelledRecords) {
      try {
        await this.processCancelledRecord(cancelledRecord);
        result.processSummary.push(
          `Record from line ${cancelledRecord.lineNumber}, updated as cancelled.`,
        );
      } catch (error) {
        // Log the error but allow the process to continue.
        const errorDescription = `Error processing cancelled record line number ${cancelledRecord.lineNumber} from file ${responseFile.filePath}`;
        result.errorsSummary.push(errorDescription);
        this.logger.error(`${errorDescription}. Error: ${error}`);
      }
    }
    try {
      // Archive file.
      const newRemoteFilePath = this.getArchiveFilePath(responseFile.filePath);
      await this.msfaaService.renameFile(
        responseFile.filePath,
        newRemoteFilePath,
      );
    } catch (error) {
      // Log the error but allow the process to continue.
      // If there was an issue only during the file archiving, it will be
      // processed again and could be archived in the second attempt.
      const logMessage = `Error while archiving MSFAA response file: ${responseFile.filePath}`;
      this.logger.error(logMessage);
      result.errorsSummary.push(logMessage);
    }

    return result;
  }

  /**
   * Gets a new file path to archive the file.
   * @param remoteFilePath full file path with a file name.
   * @returns new full file path with a file name.
   */
  private getArchiveFilePath(remoteFilePath: string) {
    const directoryPath = path.dirname(remoteFilePath);
    const fileBaseName = path.basename(remoteFilePath);
    const newRemoteFilePath = path.join(
      directoryPath,
      SFTP_ARCHIVE_DIRECTORY,
      fileBaseName,
    );
    return newRemoteFilePath;
  }

  /**
   * Process the received record of the MSFAA response file
   * by updating the columns of MSFAA Numbers table
   * @param receivedRecord MSFAA received record with
   * borrowerSignedDate and serviceProviderReceivedDate
   */
  private async processReceivedRecord(
    receivedRecord: MSFAAResponseReceivedRecord,
  ): Promise<void> {
    // The update of msfaa always comes from an external source through integration.
    // Hence the date fields are parsed as date object from external source as their date format
    // may not be necessarily ISO date format.
    await this.msfaaNumberService.updateReceivedRecord(
      receivedRecord.msfaaNumber,
      receivedRecord.offeringIntensity,
      receivedRecord.borrowerSignedDate,
      receivedRecord.serviceProviderReceivedDate,
    );
  }

  /**
   * Process the cancelled record of the MSFAA response file
   * by updating the columns of MSFAA Numbers table
   * @param cancelledRecord MSFAA received record with
   * cancelledDate and newIssuingProvince.
   */
  private async processCancelledRecord(
    cancelledRecord: MSFAAResponseCancelledRecord,
  ): Promise<void> {
    // The update of msfaa always comes from an external source through integration.
    // Hence the cancelled date is parsed as date object from external source as their date format
    // may not be necessarily ISO date format.
    await this.msfaaNumberService.updateCancelledReceivedFile(
      cancelledRecord.msfaaNumber,
      cancelledRecord.cancelledDate,
      cancelledRecord.newIssuingProvince,
    );
  }

  @InjectLogger()
  logger: LoggerService;
}
