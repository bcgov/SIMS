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
import { NotFoundException } from "@nestjs/common";
import { logProcessSummaryToJobLogger } from "../../utilities";
import { UNABLE_TO_SCAN_FILE } from "../../constants/error-code.constants";

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
    let isInfected: boolean;
    processSummary.info("Starting virus scan.");
    try {
      isInfected = await this.studentFileService.scanFile(
        job.data.uniqueFileName,
        processSummary,
      );
      processSummary.info("Completed virus scanning for the file.");
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        // If the file is not present in the database,
        // remove the file from the virus scan queue.
        await job.discard();
        processSummary.warn(
          `File ${job.data.uniqueFileName} not found or has already been scanned for viruses. Scanning the file for viruses is aborted.`,
        );
      } else if (error instanceof CustomNamedError) {
        if (error.name === UNABLE_TO_SCAN_FILE) {
          processSummary.error(
            `Unable to scan the file ${job.data.uniqueFileName} for viruses.`,
          );
        }
      } else {
        processSummary.error(
          `Error while scanning the file ${job.data.uniqueFileName} for viruses.`,
        );
      }
    } finally {
      this.logger.logProcessSummary(processSummary);
      await logProcessSummaryToJobLogger(processSummary, job);
    }
    return { fileProcessed: job.data.fileName, isInfected };
  }

  @InjectLogger()
  logger: LoggerService;
}
