import { InjectQueue, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { QueueNames } from "@sims/utilities";
import { ReturnedLoansResponseProcessingService } from "@sims/integrations/esdc-integration";

/**
 * Scheduler to process Return to Government(RTG) files.
 ** Both OTH (270 days file) and PDD (Death, Permanent Disability file) RTG files are processed by this scheduler.
 */
@Processor(QueueNames.ReturnedLoansResponseIntegration)
export class ReturnedLoansResponseIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.ReturnedLoansResponseIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly returnedLoansResponseProcessingService: ReturnedLoansResponseProcessingService,
    logger: LoggerService,
  ) {
    super(schedulerQueue, queueService, logger);
  }

  /**
   * Process the returned loans response file(s).
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns process summary.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string[]> {
    const processingResponse =
      await this.returnedLoansResponseProcessingService.process(processSummary);
    return [
      "Process finalized with success.",
      `Received files: ${processingResponse.receivedFiles}.`,
    ];
  }
}
