import { Injectable } from "@nestjs/common";
import { CustomNamedError, processInParallel } from "@sims/utilities";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import {
  IndividualReturnedLoan,
  ReturnedLoansDownloadResponse,
  ReturnedLoansResponseResult,
} from "./models/returned-loans-response.model";
import { ReturnedLoansResponseIntegrationService } from "./returned-loans-response.integration.service";
import { ReturnedLoansResponseFileAddressDetail } from "./returned-loans-response-files/returned-loans-response-file-address-detail";
import { ReturnedLoansResponseFileReturnedLoanDetail } from "./returned-loans-response-files/returned-loans-response-file-returned-loan-detail";

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
   * @returns processing result.
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
          String.raw`^${this.esdcConfig.environmentCode}EDU\.PBC\.RTG\.(OTH|PDD)\.D[0-9]{7}\.[0-9]{3}$`,
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
   * Processes a returned loans response file.
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
        `The downloaded file ${remoteFilePath} contains ${downloadResponse.addressDetailRecords.length} address detail records, ${downloadResponse.returnedLoanDetailRecords.length} returned loan detail records, and ${downloadResponse.unknownRecords.length} unknown records.`,
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
    const { addressDetailRecords, returnedLoanDetailRecords, unknownRecords } =
      downloadResponse;
    if (unknownRecords.length) {
      fileProcessSummary.warn(
        `The downloaded file ${remoteFilePath} contains records with unknown record types: ${downloadResponse.unknownRecords.map((r) => r.recordType).join(", ")}.`,
      );
    }
    // TODO: When the details records are being persisted, business must confirm if we should continue processing
    // when there are no returned loan detail records but there are address detail records.
    if (!returnedLoanDetailRecords.length) {
      fileProcessSummary.error(
        `The downloaded file ${remoteFilePath} contains no returned loan detail records to process.`,
      );
      return;
    }
    // Create a map of returned loan address detail records keyed by SIN to process returned loan detail records.
    const returnedLoanAddressDetailRecordsMap: Map<
      string,
      ReturnedLoansResponseFileAddressDetail
    > = new Map(addressDetailRecords.map((record) => [record.sin, record]));
    // TODO: The individual and returned loan details should be persisted to the database.
    const individualReturnedLoans: IndividualReturnedLoan[] = [];
    for (const returnedLoanDetailRecord of returnedLoanDetailRecords) {
      const recordProcessSummary = new ProcessSummary();
      fileProcessSummary.children(recordProcessSummary);
      // Process the returned loans record.
      this.processReturnedLoan(
        returnedLoanDetailRecord,
        returnedLoanAddressDetailRecordsMap,
        individualReturnedLoans,
        recordProcessSummary,
      );
    }
    fileProcessSummary.info(
      `Finished processing records for the returned loans response file ${remoteFilePath}.`,
    );
  }

  /**
   * Process a returned loans response record.
   * @param returnedLoanDetailRecord returned loan detail record to process.
   * @param returnedLoanAddressDetailRecordsMap map of returned loan address detail records keyed by SIN.
   * @param individualReturnedLoans array to collect processed individual returned loans.
   * @param processSummary process summary for logging the processing steps and errors.
   */
  private processReturnedLoan(
    returnedLoanDetailRecord: ReturnedLoansResponseFileReturnedLoanDetail,
    returnedLoanAddressDetailRecordsMap: Map<
      string,
      ReturnedLoansResponseFileAddressDetail
    >,
    individualReturnedLoans: IndividualReturnedLoan[],
    processSummary: ProcessSummary,
  ): void {
    processSummary.info(
      `Received returned loan detail record with return reason ${returnedLoanDetailRecord.returnReason} at line ${returnedLoanDetailRecord.lineNumber}.`,
    );
    const canProcess = this.validateReturnedLoanDetail(
      returnedLoanDetailRecord,
      returnedLoanAddressDetailRecordsMap,
      processSummary,
    );
    if (!canProcess) {
      // Skip processing this returned loan detail record if it cannot be processed due to validation errors.
      return;
    }
    const addressDetailRecord = returnedLoanAddressDetailRecordsMap.get(
      returnedLoanDetailRecord.sin,
    );

    individualReturnedLoans.push({
      individual: addressDetailRecord,
      returnedLoan: returnedLoanDetailRecord,
    });
  }

  /**
   * Validates a returned loan detail record to identify if it can be processed.
   * @param returnedLoanDetailRecord returned loan detail record to validate.
   * @param returnedLoanAddressDetailRecordsMap map of returned loan address detail records keyed by SIN.
   * @param processSummary process summary for logging the validation steps and errors.
   * @returns true if the returned loan detail record can be processed, false otherwise.
   */
  private validateReturnedLoanDetail(
    returnedLoanDetailRecord: ReturnedLoansResponseFileReturnedLoanDetail,
    returnedLoanAddressDetailRecordsMap: Map<
      string,
      ReturnedLoansResponseFileAddressDetail
    >,
    processSummary: ProcessSummary,
  ): boolean {
    const validationErrors = returnedLoanDetailRecord.validate();
    if (validationErrors.length) {
      processSummary.error(
        `Validation errors for returned loan detail record at line ${returnedLoanDetailRecord.lineNumber}: ${validationErrors.join(", ")}.`,
      );
      return false;
    }
    if (
      !returnedLoanAddressDetailRecordsMap.has(returnedLoanDetailRecord.sin)
    ) {
      processSummary.error(
        `No address detail record found for the returned loan detail record SIN at line ${returnedLoanDetailRecord.lineNumber}.`,
      );
      return false;
    }
    return true;
  }
}
