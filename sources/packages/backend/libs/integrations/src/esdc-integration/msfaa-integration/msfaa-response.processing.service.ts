import { Injectable } from "@nestjs/common";
import { MSFAANumberService } from "@sims/integrations/services";
import { OfferingIntensity } from "@sims/sims-db";
import {
  LoggerService,
  InjectLogger,
  ProcessSummary,
} from "@sims/utilities/logger";
import {
  MSFAASFTPResponseFile,
  ReceivedStatusCode,
} from "./models/msfaa-integration.model";
import { MSFAAResponseCancelledRecord } from "./msfaa-files/msfaa-response-cancelled-record";
import { MSFAAResponseReceivedRecord } from "./msfaa-files/msfaa-response-received-record";
import { MSFAAIntegrationService } from "./msfaa.integration.service";

@Injectable()
export class MSFAAResponseProcessingService {
  constructor(
    private readonly msfaaNumberService: MSFAANumberService,
    private readonly msfaaService: MSFAAIntegrationService,
  ) {}

  /**
   * Download all files from MSFAA Response folder on SFTP and process them all.
   * @param offeringIntensity offering intensity.
   * @param processSummary process summary for logging.
   */
  async processResponses(
    offeringIntensity: OfferingIntensity,
    processSummary: ProcessSummary,
  ): Promise<void> {
    const filePaths = await this.msfaaService.getResponseFilesFullPath(
      offeringIntensity,
    );
    for (const filePath of filePaths) {
      const childProcessSummary = new ProcessSummary();
      processSummary.children(childProcessSummary);
      await this.processFile(filePath, childProcessSummary);
    }
  }

  /**
   * Process each individual MSFAA response file from the SFTP.
   * @param filePath MSFAA response file to be processed.
   * @param processSummary process summary for logging.
   * @returns Process summary and errors summary.
   */
  private async processFile(
    filePath: string,
    processSummary: ProcessSummary,
  ): Promise<void> {
    processSummary.info(`Processing file ${filePath}.`);
    let responseFile: MSFAASFTPResponseFile;
    try {
      responseFile = await this.msfaaService.downloadResponseFile(filePath);
    } catch (error: unknown) {
      const errorMessage = `Error downloading file ${filePath}.`;
      this.logger.error(errorMessage, error);
      processSummary.error(errorMessage, error);
      // Abort the process nicely not throwing an exception and
      // allowing other response files to be processed.
      return;
    }
    processSummary.info("File contains:");
    processSummary.info(
      `Confirmed MSFAA records (type ${ReceivedStatusCode.Received}): ${responseFile.receivedRecords.length}.`,
    );
    processSummary.info(
      `Cancelled MSFAA records (type ${ReceivedStatusCode.Cancelled}): ${responseFile.cancelledRecords.length}.`,
    );
    for (const receivedRecord of responseFile.receivedRecords) {
      try {
        await this.processReceivedRecord(receivedRecord);
        processSummary.info(
          `Record from line ${receivedRecord.lineNumber}, updated as confirmed.`,
        );
      } catch (error: unknown) {
        // Log the error but allow the process to continue.
        const errorDescription = `Error processing record line number ${receivedRecord.lineNumber} from file ${responseFile.filePath}.`;
        processSummary.error(errorDescription, error);
        this.logger.error(errorDescription, error);
      }
    }
    for (const cancelledRecord of responseFile.cancelledRecords) {
      try {
        await this.processCancelledRecord(cancelledRecord);
        processSummary.info(
          `Record from line ${cancelledRecord.lineNumber}, updated as cancelled.`,
        );
      } catch (error) {
        // Log the error but allow the process to continue.
        const errorDescription = `Error processing cancelled record line number ${cancelledRecord.lineNumber} from file ${responseFile.filePath}.`;
        processSummary.error(errorDescription, error);
        this.logger.error(errorDescription, error);
      }
    }
    try {
      // Archive file.
      await this.msfaaService.archiveFile(responseFile.filePath);
    } catch (error) {
      // Log the error but allow the process to continue.
      // If there was an issue only during the file archiving, it will be
      // processed again and could be archived in the second attempt.
      const logMessage = `Error while archiving MSFAA response file: ${responseFile.filePath}.`;
      processSummary.error(logMessage, error);
      this.logger.error(logMessage, error);
    }
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
