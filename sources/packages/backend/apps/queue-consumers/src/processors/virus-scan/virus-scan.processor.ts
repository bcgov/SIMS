import { Process, Processor } from "@nestjs/bull";
import { CustomNamedError, QueueNames } from "@sims/utilities";
import { StudentFileService } from "apps/queue-consumers/src/services";
import { Job } from "bull";
import { VirusScanQueueInDTO } from "@sims/services/queue/dto/virus-scan.dto";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import { NotFoundException } from "@nestjs/common";
import { logProcessSummaryToJobLogger } from "../../utilities";
import { UNABLE_TO_SCAN_FILE } from "../../constants/error-code.constants";

@Processor(QueueNames.VirusScanProcessor)
export class VirusScanProcessor {
  constructor(private readonly studentFileService: StudentFileService) {}

  /**
   * Perform virus scanning for all the files having pending scan status.
   */
  @Process()
  async performVirusScan(job: Job<VirusScanQueueInDTO>) {
    const processSummary = new ProcessSummary();
    processSummary.info("Starting virus scan.");
    try {
      await this.studentFileService.scanFile(job.data.uniqueFileName);
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
  }

  @InjectLogger()
  logger: LoggerService;
}
