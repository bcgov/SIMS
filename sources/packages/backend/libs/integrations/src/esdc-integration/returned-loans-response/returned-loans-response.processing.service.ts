import { Injectable } from "@nestjs/common";
import { CustomNamedError, processInParallel } from "@sims/utilities";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import {
  ReturnedLoansDownloadResponse,
  ReturnedLoansResponseRecordType,
  ReturnedLoansResponseResult,
} from "./models/returned-loans-response.model";
import { ReturnedLoansResponseIntegrationService } from "./returned-loans-response.integration.service";
import { ReturnedLoansResponseFileDetail } from "./returned-loans-response-files/returned-loans-response-file-detail";
import { ReturnedLoansResponseFileAddressDetail } from "@sims/integrations/esdc-integration/returned-loans-response/returned-loans-response-files/returned-loans-response-file-address-detail";
import { ReturnedLoansResponseFileReturnedLoanDetail } from "@sims/integrations/esdc-integration/returned-loans-response/returned-loans-response-files/returned-loans-response-file-returned-loan-detail";

/**
 * Processes the returned loans response file(s)
 * which includes both OTH (270 days file) and PDD (Death, Permanent Disability file).
 */
@Injectable()
export class ReturnedLoansResponseProcessingService {
  private readonly esdcConfig: ESDCIntegrationConfig;
  constructor(
    configService: ConfigService,
    private readonly integrationService: ReturnedLoansResponseIntegrationService,
    private readonly logger: LoggerService,
  ) {
    this.esdcConfig = configService.esdcIntegration;
  }

  /**
   * Processes the returned loans response file(s).
   * Both OTH (270 days file) and PDD (Death, Permanent Disability file) are processed.
   * @param processSummary process summary.
   */
  async process(
    processSummary: ProcessSummary,
  ): Promise<ReturnedLoansResponseResult> {
    // Check for the returned loans response file(s) in the SFTP response folder.
    const remoteFilePaths =
      await this.integrationService.getResponseFilesFullPath(
        this.esdcConfig.ftpResponseFolder,
        // The regex pattern to match the returned loans response file for OTH (270 days file) and PDD (Death, Permanent Disability file).
        new RegExp(
          `^${this.esdcConfig.environmentCode}EDU.PBC.RTG.(OTH|PDD).D[0-9]{7}.[0-9]{3}$`,
          "i",
        ),
      );

    if (!remoteFilePaths.length) {
      const message = "There are no returned loans response files received.";
      this.logger.log(message);
      processSummary.info(message);
      return { receivedFiles: 0 };
    }
    // Using logger to log immediately the received file details.
    this.logger.log(
      `Received returned loans response files: ${remoteFilePaths.join(", ")}`,
    );
    processSummary.info(
      `Received ${remoteFilePaths.length} returned loans response file(s) to process.`,
    );
    // Process all the files in parallel.
    await processInParallel<void, string>(
      (remoteFilePath: string) =>
        this.processFile(remoteFilePath, processSummary),
      remoteFilePaths,
    );
    return { receivedFiles: remoteFilePaths.length };
  }

  /**
   * Processes an returned loans response file.
   * The processing of a cancellation involves rejecting the eligible disbursements
   * identified by the document number in the cancellation response file.
   * @param remoteFilePath remote file path.
   * @param processSummary process summary.
   */
  private async processFile(
    remoteFilePath: string,
    processSummary: ProcessSummary,
  ): Promise<void> {
    // Create a child process summary for logging.
    const fileProcessSummary = new ProcessSummary();
    processSummary.children(fileProcessSummary);

    fileProcessSummary.info(
      `Downloading returned loans response file ${remoteFilePath}.`,
    );
    let downloadResponse: ReturnedLoansDownloadResponse;
    try {
      // Download and parse the returned loans response file.
      downloadResponse =
        await this.integrationService.downloadResponseFile(remoteFilePath);
      fileProcessSummary.info(
        `The downloaded file ${remoteFilePath} contains ${downloadResponse.detailRecords.length} detail records.`,
      );
    } catch (error: unknown) {
      // Abort the process nicely not throwing an exception and
      // allowing other response files to be processed.
      if (error instanceof CustomNamedError) {
        fileProcessSummary.error(error.message);
      } else {
        fileProcessSummary.error(
          `Unexpected error downloading the file ${remoteFilePath}.`,
          error,
        );
      }
      return;
    }

    for (const detailRecord of downloadResponse.detailRecords) {
      const recordProcessSummary = new ProcessSummary();
      fileProcessSummary.children(recordProcessSummary);

      // Process the returned loans record.
      this.processRecord(detailRecord, recordProcessSummary);
    }

    fileProcessSummary.info(
      `Finished processing records for the returned loans response file: ${remoteFilePath}.`,
    );

    // Archive the processed file on successful completion.
    if (!processSummary.getLogLevelSum().error) {
      await this.archiveFile(remoteFilePath, processSummary);
    }
  }

  /**
   * Process a returned loans response file detail record.
   * @param detailRecord detail record to process.
   * @param processSummary process summary for logging the processing steps and errors.
   */
  private processRecord(
    detailRecord: ReturnedLoansResponseFileDetail,
    processSummary: ProcessSummary,
  ): void {
    switch (detailRecord.recordType) {
      // TODO: Implement the processing logic for address and returned loan detail records.
      case ReturnedLoansResponseRecordType.AddressDetail: {
        const addressDetailRecord = new ReturnedLoansResponseFileAddressDetail(
          detailRecord.line,
          detailRecord.lineNumber,
        );
        processSummary.info(
          `Received address detail record at line ${addressDetailRecord.lineNumber}.`,
        );
        break;
      }
      case ReturnedLoansResponseRecordType.ReturnedLoanDetail: {
        const returnedLoanDetailRecord =
          new ReturnedLoansResponseFileReturnedLoanDetail(
            detailRecord.line,
            detailRecord.lineNumber,
          );
        processSummary.info(
          `Received returned loan detail record with return reason ${returnedLoanDetailRecord.returnReason} at line ${returnedLoanDetailRecord.lineNumber}.`,
        );
        break;
      }
      default:
        processSummary.info(
          `Invalid record type ${detailRecord.recordType} at line ${detailRecord.lineNumber}.`,
        );
        return;
    }
  }

  /**
   * Archive the processed file after successful processing.
   * @param remoteFilePath remote file path to archive.
   * @param processSummary process summary.
   */
  private async archiveFile(
    remoteFilePath: string,
    processSummary: ProcessSummary,
  ): Promise<void> {
    try {
      await this.integrationService.archiveFile(remoteFilePath);
    } catch (error: unknown) {
      // Log the error but do not abort the process, allowing other records to be processed.
      processSummary.error(
        `Error archiving the file ${remoteFilePath}.`,
        error,
      );
    }
  }
}
