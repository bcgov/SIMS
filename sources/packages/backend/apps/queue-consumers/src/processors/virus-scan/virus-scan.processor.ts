import { Process, Processor } from "@nestjs/bull";
import { CustomNamedError, QueueNames } from "@sims/utilities";
import { StudentFileService } from "../../services";
import { Job } from "bull";
import { VirusScanQueueInDTO, VirusScanResult } from "@sims/services/queue";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import { logProcessSummaryToJobLogger } from "../../utilities";
import {
  CONNECTION_FAILED,
  FILE_NOT_FOUND,
  SERVER_UNAVAILABLE,
} from "@sims/services/constants";

@Processor(QueueNames.FileVirusScanProcessor)
export class VirusScanProcessor {
  constructor(private readonly studentFileService: StudentFileService) {}

  /**
   * Perform virus scanning for all the files having pending scan status.
   * @param job information to perform the process.
   * @returns VirusScanResult virus scan result log.
   */
  @Process()
  async performVirusScan(
    job: Job<VirusScanQueueInDTO>,
  ): Promise<VirusScanResult> {
    const processSummary = new ProcessSummary();
    let isInfected: boolean = null;
    let serverAvailability = "uncertain";
    processSummary.info("Starting virus scan.");
    try {
      isInfected = await this.studentFileService.scanFile(
        job.data,
        job.attemptsMade,
        processSummary,
      );
      serverAvailability = "available";
      processSummary.info("Completed virus scanning for the file.");
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        let errorMessage = "";
        if (error.name === FILE_NOT_FOUND) {
          // If the file is not present in the database, remove the file from the virus scan queue.
          await job.discard();
          errorMessage = `File ${job.data.uniqueFileName} is not found or has already been scanned for viruses. Scanning the file for viruses is aborted.`;
        } else if (error.name === CONNECTION_FAILED) {
          serverAvailability = "available";
          errorMessage = `${error.message} Connection to ClamAV server failed.`;
        } else if (error.name === SERVER_UNAVAILABLE) {
          serverAvailability = "unavailable";
          errorMessage = `${error.message} ClamAV server is unavailable.`;
        } else {
          errorMessage = `${error.message} Unknown error.`;
        }
        processSummary.info(
          `ClamAV server availability: ${serverAvailability}.`,
        );
        processSummary.info(
          `Number of attempts made: ${job.attemptsMade + 1}.`,
        );
        processSummary.error(errorMessage);
        throw new Error(errorMessage);
      }
    } finally {
      this.logger.logProcessSummary(processSummary);
      await logProcessSummaryToJobLogger(processSummary, job);
    }
    return {
      fileProcessed: job.data.fileName,
      isInfected,
      serverAvailability,
    };
  }

  @InjectLogger()
  logger: LoggerService;
}
