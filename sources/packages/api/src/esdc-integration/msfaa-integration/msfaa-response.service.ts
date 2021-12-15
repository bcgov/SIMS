import { Injectable, LoggerService } from "@nestjs/common";
import { InjectLogger } from "../../common";
import { MSFAANumberService } from "../../services";
import {
  MSFAASFTPResponseFile,
  ProcessSftpResponseResult,
} from "./models/msfaa-integration.model";
import { MSFAAResponseCancelledRecord } from "./msfaa-files/msfaa-response-cancelled-record";
import { MSFAAResponseReceivedRecord } from "./msfaa-files/msfaa-response-received-record";
import { MSFAAIntegrationService } from "./msfaa-integration.service";

@Injectable()
export class MSFAAResponseService {
  constructor(
    private readonly msfaaNumberService: MSFAANumberService,
    private readonly msfaaService: MSFAAIntegrationService,
  ) {}
  /**
   * Download all files from MSFAA Response folder on SFTP and process them all.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  async processResponses(): Promise<ProcessSftpResponseResult[]> {
    const filePaths = await this.msfaaService.getResponseFilesFullPath();
    const processFiles: ProcessSftpResponseResult[] = [];
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
  ): Promise<ProcessSftpResponseResult> {
    const result = new ProcessSftpResponseResult();
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

    result.processSummary.push(
      `File contains ${responseFile.receivedRecords.length} received records and ${responseFile.cancelledRecords.length} cancelled records.`,
    );

    for (const receivedRecord of responseFile.receivedRecords) {
      try {
        await this.processReceivedRecord(receivedRecord);
        result.processSummary.push(
          `Status record from line ${receivedRecord.lineNumber}.`,
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
          `Status cancelled record from line ${cancelledRecord.lineNumber}.`,
        );
      } catch (error) {
        // Log the error but allow the process to continue.
        const errorDescription = `Error processing cancelled record line number ${cancelledRecord.lineNumber} from file ${responseFile.filePath}`;
        result.errorsSummary.push(errorDescription);
        this.logger.error(`${errorDescription}. Error: ${error}`);
      }
    }
    try {
      await this.msfaaService.deleteFile(responseFile.filePath);
    } catch (error) {
      // Log the error but allow the process to continue.
      // If there was an issue only during the file removal, it will be
      // processed again and could be deleted in the second attempt.
      const logMessage = `Error while deleting MSFAA response file: ${responseFile.filePath}`;
      this.logger.error(logMessage);
      result.errorsSummary.push(logMessage);
    }

    return result;
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
    const updateResult = await this.msfaaNumberService.updateReceivedFile(
      receivedRecord.msfaaNumber,
      receivedRecord.borrowerSignedDate,
      receivedRecord.serviceProviderReceivedDate,
    );

    // Expected to update 1 and only 1 record.
    if (updateResult.affected !== 1) {
      throw new Error(
        `Error while updating MSFAA number: ${receivedRecord.msfaaNumber}. Number of affected rows was ${updateResult.affected}, expected 1.`,
      );
    }
  }

  /**
   * Process the cancelled record of the MSFAA response file
   * by updating the columns of MSFAA Numbers table
   * @param cancelledRecord MSFAA received record with
   * cancelledDate and newIssusingProvince.
   */
  private async processCancelledRecord(
    cancelledRecord: MSFAAResponseCancelledRecord,
  ): Promise<void> {
    const updateResult =
      await this.msfaaNumberService.updateCancelledReceivedFile(
        cancelledRecord.msfaaNumber,
        cancelledRecord.cancelledDate,
        cancelledRecord.newIssusingProvince,
      );

    // Expected to update 1 and only 1 record.
    if (updateResult.affected !== 1) {
      throw new Error(
        `Error while updating MSFAA number: ${cancelledRecord.msfaaNumber}. Number of affected rows was ${updateResult.affected}, expected 1.`,
      );
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
