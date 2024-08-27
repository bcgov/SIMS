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
import { FILE_NOT_FOUND } from "../../constants/error-code.constants";

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
    processSummary.info("Starting virus scan.");
    try {
      isInfected = await this.studentFileService.scanFile(
        job.data.uniqueFileName,
        processSummary,
      );
      processSummary.info("Completed virus scanning for the file.");
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        const errorMessage = error.message;
        if (error.name === FILE_NOT_FOUND) {
          // If the file is not present in the database, remove the file from the virus scan queue.
          await job.discard();
        }
        processSummary.error(errorMessage);
        throw new Error(errorMessage, { cause: error.name });
      }
    } finally {
      this.logger.logProcessSummary(processSummary);
      await logProcessSummaryToJobLogger(processSummary, job);
    }
    return {
      fileProcessed: job.data.fileName,
      isInfected,
    };
  }

  @InjectLogger()
  logger: LoggerService;
}
