import { Injectable } from "@nestjs/common";
import {
  DisbursementScheduleSharedService,
  SystemUsersService,
} from "@sims/services";
import { DISBURSEMENT_SCHEDULE_NOT_FOUND } from "@sims/services/constants";
import { CustomNamedError, processInParallel } from "@sims/utilities";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import { ProcessSummary } from "@sims/utilities/logger";
import { ECertCancellationResponseFileDetail } from "./e-cert-cancellation-response-files/e-cert-cancellation-response-file-detail";
import { ECertCancellationResponseIntegrationService } from "./e-cert-cancellation-response.integration.service";
import {
  ECertCancellationDownloadResponse,
  ECertCancellationResponseRecordType,
  ECertCancellationResponseResult,
} from "./models/e-cert-cancellation-response.model";

/**
 *  Processes the E-Cert cancellation response file(s).
 *  Both Full-time and Part-time E-Cert cancellation response files are processed.
 */
@Injectable()
export class ECertCancellationResponseProcessingService {
  private readonly esdcConfig: ESDCIntegrationConfig;
  constructor(
    configService: ConfigService,
    private readonly integrationService: ECertCancellationResponseIntegrationService,
    private readonly disbursementScheduleSharedService: DisbursementScheduleSharedService,
    private readonly systemUsersService: SystemUsersService,
  ) {
    this.esdcConfig = configService.esdcIntegration;
  }
  /**
   * Processes the E-Cert cancellation response file(s).
   * Both Full-time and Part-time E-Cert cancellation response files are processed.
   * @param processSummary process summary.
   */
  async process(
    processSummary: ProcessSummary,
  ): Promise<ECertCancellationResponseResult> {
    // Check for the E-Cert cancellation response file(s) in the SFTP response folder.
    const remoteFilePaths =
      await this.integrationService.getResponseFilesFullPath(
        this.esdcConfig.ftpResponseFolder,
        // The regex pattern to match the E-Cert cancellation response file for Full-time and Part-time.
        new RegExp(
          `^${this.esdcConfig.environmentCode}EDU.PBC.CAN.(ECRT|PTECRT).[0-9]{8}.[0-9]{3}$`,
          "i",
        ),
      );

    if (!remoteFilePaths.length) {
      processSummary.info(
        "There are no e-cert cancellation response files received.",
      );
      return { receivedCancellationFiles: 0 };
    }
    processSummary.info(
      `Received ${remoteFilePaths.length} e-cert cancellation response file(s) to process.`,
    );
    // Process all the files in parallel.
    await processInParallel<void, string>(
      (remoteFilePath: string) =>
        this.processCancellationFile(remoteFilePath, processSummary),
      remoteFilePaths,
    );
    return { receivedCancellationFiles: remoteFilePaths.length };
  }

  /**
   * Processes an e-cert cancellation response file.
   * The processing of a cancellation involves rejecting the eligible disbursements
   * identified by the document number in the cancellation response file.
   * @param remoteFilePath remote file path.
   * @param processSummary process summary.
   */
  private async processCancellationFile(
    remoteFilePath: string,
    processSummary: ProcessSummary,
  ): Promise<void> {
    // Create a child process summary for logging.
    const childProcessSummary = new ProcessSummary();
    processSummary.children(childProcessSummary);

    childProcessSummary.info(
      `Downloading e-cert cancellation response file ${remoteFilePath}.`,
    );
    let eCertCancellationDownloadResponse: ECertCancellationDownloadResponse;
    try {
      // Download and parse the E-Cert cancellation response file.
      eCertCancellationDownloadResponse =
        await this.integrationService.downloadResponseFile(remoteFilePath);
      childProcessSummary.info(
        `The downloaded file ${remoteFilePath} contains ${eCertCancellationDownloadResponse.detailRecords.length} detail records.`,
      );
    } catch (error: unknown) {
      // Abort the process nicely not throwing an exception and
      // allowing other response files to be processed.
      if (error instanceof CustomNamedError) {
        childProcessSummary.error(error.message);
      } else {
        childProcessSummary.error(
          `Unexpected error downloading the file ${remoteFilePath}.`,
          error,
        );
      }
      return;
    }

    for (const cancellationRecord of eCertCancellationDownloadResponse.detailRecords) {
      const recordProcessSummary = new ProcessSummary();
      childProcessSummary.children(recordProcessSummary);

      recordProcessSummary.info(
        `Processing cancellation record for document number ${cancellationRecord.documentNumber} at line ${cancellationRecord.lineNumber}.`,
      );

      // Cancel the e-cert record if the document number is valid for cancellation.
      await this.processECertCancellationRecord(
        cancellationRecord,
        recordProcessSummary,
      );
    }

    // Archive the processed file on successful completion.
    if (!processSummary.getLogLevelSum().error) {
      await this.archiveFile(remoteFilePath, processSummary);
    }
  }

  /**
   * Sanitize the cancellation record.
   * @param cancellationRecord cancellation record.
   * @returns true if the record is valid, false otherwise.
   */
  private sanitizeCancellationRecord(
    cancellationRecord: ECertCancellationResponseFileDetail,
  ): string | null {
    const errorMessage: string[] = [];
    if (
      cancellationRecord.recordType !==
      ECertCancellationResponseRecordType.Detail
    ) {
      errorMessage.push(`invalid record type ${cancellationRecord.recordType}`);
    }
    if (!cancellationRecord.documentNumber) {
      errorMessage.push("invalid document number");
    }
    return errorMessage.length ? errorMessage.join(", ") : null;
  }

  /**
   * Validate and cancel an e-cert record if the document number is valid for cancellation.
   * @param documentNumber document number.
   * @param processSummary process summary.
   */
  private async processECertCancellationRecord(
    cancellationRecord: ECertCancellationResponseFileDetail,
    processSummary: ProcessSummary,
  ): Promise<void> {
    const validationErrorMessage =
      this.sanitizeCancellationRecord(cancellationRecord);
    // If the record is not valid, log an error and skip processing this record.
    if (validationErrorMessage) {
      processSummary.error(
        `Invalid detail record at line ${cancellationRecord.lineNumber}: ${validationErrorMessage}.`,
      );
      return;
    }
    const auditUser = this.systemUsersService.systemUser;
    const documentNumber = cancellationRecord.documentNumber;
    try {
      await this.disbursementScheduleSharedService.rejectDisbursementByDocumentNumber(
        documentNumber,
        auditUser.id,
      );
      processSummary.info(
        `E-Cert with document number ${documentNumber} has been cancelled.`,
      );
    } catch (error: unknown) {
      // If the document number is not found, log information as this is expected.
      if (
        error instanceof CustomNamedError &&
        error.name === DISBURSEMENT_SCHEDULE_NOT_FOUND
      ) {
        processSummary.info(error.message);
      } else {
        // If any other error occurs, log error without aborting the process, allowing other records to be processed.
        processSummary.error(
          `Unexpected error cancelling E-Cert for document number ${documentNumber}.`,
          error,
        );
      }
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
