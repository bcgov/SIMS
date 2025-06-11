import {
  ECertCancellationDownloadResponse,
  ECertCancellationResponseResult,
} from "./models/e-cert-cancellation-response.model";
import { ESDCIntegrationConfig, ConfigService } from "@sims/utilities/config";
import { ECertCancellationResponseIntegrationService } from "./e-cert-cancellation-response.integration.service";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import { CustomNamedError, processInParallel } from "@sims/utilities";
import { Injectable } from "@nestjs/common";
import { FILE_PARSING_ERROR } from "@sims/services/constants";

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
  ) {
    this.esdcConfig = configService.esdcIntegration;
  }
  /**
   * Processes the E-Cert cancellation response file.
   * @param fileContent The content of the E-Cert cancellation response file.
   * @returns Processed data from the E-Cert cancellation response file.
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
        "There are no e-cert cancellation response files found.",
      );
      return { receivedCancellationFiles: 0 };
    }
    processSummary.info(
      `Found ${remoteFilePaths.length} e-cert cancellation response file(s) to process.`,
    );
    // Process all the files in parallel.
    await processInParallel<void, string>(
      (remoteFilePath: string) =>
        this.processCancellationFile(remoteFilePath, processSummary),
      remoteFilePaths,
    );
    return { receivedCancellationFiles: remoteFilePaths.length };
  }

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
      if (
        error instanceof CustomNamedError &&
        error.name === FILE_PARSING_ERROR
      ) {
        // Abort the process on file parsing error with a warning message.
        // To avoid the job from being retried, it has been logged as a warning.
        processSummary.warn(error.message);
      } else {
        // Abort the process nicely not throwing an exception and
        // allowing other response files to be processed.
        processSummary.error(
          `Error downloading the file ${remoteFilePath}.`,
          error,
        );
      }
      return;
    }
    // Check if the file has detail records to process.
    if (!eCertCancellationDownloadResponse.detailRecords.length) {
      childProcessSummary.info(
        `The e-cert cancellation response file ${remoteFilePath} has no detail records to process.`,
      );
      return;
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
