import { InjectQueue, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import { QueueNames } from "@sims/utilities";
import { ECertCancellationResponseProcessingService } from "@sims/integrations/esdc-integration";

@Processor(QueueNames.ECertCancellationResponseIntegration)
export class ECertCancellationResponseIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.ECertCancellationResponseIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly eCertCancellationResponseProcessingService: ECertCancellationResponseProcessingService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Process the e-cert cancellation file(s) and update the disbursements.
   * Both Full-time and Part-time e-Cert cancellation files are processed by this scheduler.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns process summary.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string[]> {
    const processingResponse =
      await this.eCertCancellationResponseProcessingService.process(
        processSummary,
      );

    return [
      "Process finalized with success.",
      `Received cancellation files: ${processingResponse.receivedCancellationFiles}.`,
    ];
  }

  /**
   * Setting the logger here allows the correct context to be set
   * during the property injection.
   * Even if the logger is not used, it is required to be set, to
   * allow the base classes to write logs using the correct context.
   */
  @InjectLogger()
  declare logger: LoggerService;
}
