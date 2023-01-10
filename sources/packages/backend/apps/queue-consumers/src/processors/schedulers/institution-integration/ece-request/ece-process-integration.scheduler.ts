import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { ECEFileService } from "@sims/integrations/institution-integration/ece-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { QueueProcessSummaryResult } from "../../../models/processors.models";
import { BaseScheduler } from "../../base-scheduler";

@Processor(QueueNames.ECEProcessIntegration)
export class ECEProcessIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.ECEProcessIntegration)
    schedulerQueue: Queue<void>,
    private readonly eceFileService: ECEFileService,
    queueService: QueueService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Identifies all the applications that have an eligible COE request waiting
   * for a particular institution.
   * @returns Processing result log.
   */
  @Process()
  async processECERequest(
    job: Job<void>,
  ): Promise<QueueProcessSummaryResult[]> {
    this.logger.log(
      `Processing ECE request integration job ${job.id} of type ${job.name}.`,
    );
    this.logger.log("Executing ECE request file generation ...");
    const uploadResults = await this.eceFileService.processECEFile();
    this.logger.log("ECE request file generation completed.");
    await this.cleanSchedulerQueueHistory();

    return uploadResults.map(
      (uploadResult) =>
        ({
          summary: [
            `The uploaded file: ${uploadResult.generatedFile}`,
            `The number of records: ${uploadResult.uploadedRecords}`,
          ],
        } as QueueProcessSummaryResult),
    );
  }

  @InjectLogger()
  logger: LoggerService;
}
