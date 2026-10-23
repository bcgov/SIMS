import { Processor } from "@nestjs/bullmq";
import { QueueNames } from "@sims/utilities";
import { StudentFileService } from "../../services";
import { VirusScanQueueInDTO } from "@sims/services/queue";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { Job } from "bullmq";
import { BaseQueueProcessor } from "..";

/**
 * Queue name for the processor.
 */
const QUEUE_NAME = QueueNames.FileVirusScanProcessor;

/**
 * Processor responsible for handling virus scan jobs.
 */
@Processor(QUEUE_NAME, BaseQueueProcessor.defaultWorkerOptions)
export class VirusScanProcessor extends BaseQueueProcessor<VirusScanQueueInDTO> {
  constructor(
    private readonly studentFileService: StudentFileService,
    protected readonly logger: LoggerService,
  ) {
    super(QUEUE_NAME, logger);
  }

  /**
   * Perform virus scanning for all the files having pending scan status.
   * @param job information to perform the process.
   * @param processSummary process summary for logging.
   * @returns VirusScanResult virus scan result log.
   */
  async processQueue(
    job: Job<VirusScanQueueInDTO>,
    processSummary: ProcessSummary,
  ): Promise<string[]> {
    const uniqueFileName = job.data.uniqueFileName;
    processSummary.info(`Starting virus scan for file: ${uniqueFileName}.`);
    const isInfected = await this.studentFileService.scanFile(
      job.data.uniqueFileName,
      processSummary,
    );
    processSummary.info(
      `Completed virus scanning for the file: ${uniqueFileName}.`,
    );
    return ["Virus scan completed successfully.", `Is infected: ${isInfected}`];
  }
}
