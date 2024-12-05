import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { QueueProcessSummaryResult } from "../../../models/processors.models";
import { BaseScheduler } from "../../base-scheduler";
import { ECEResponseProcessingService } from "@sims/integrations/institution-integration/ece-integration";

@Processor(QueueNames.ECEProcessResponseIntegration)
export class ECEResponseIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.ECEProcessResponseIntegration)
    schedulerQueue: Queue<void>,
    private readonly eceResponseProcessingService: ECEResponseProcessingService,
    queueService: QueueService,
  ) {
    super(schedulerQueue, queueService);
  }

  processQueue(job: Job<void>): Promise<string | string[]> {
    throw new Error("Method not implemented.");
  }

  async process(
    _job: Job<void>,
    _processSummary: ProcessSummary,
  ): Promise<string | string[]> {
    throw new Error("Method not implemented.");
  }

  /**
   * Process all the institution ECE responses and update the enrolment accordingly.
   * @params job details.
   * @returns Processing result log.
   */
  @Process()
  async processECEResponse(
    job: Job<void>,
  ): Promise<QueueProcessSummaryResult[]> {
    this.logger.log(
      `Processing ECE response integration job ${job.id} of type ${job.name}.`,
    );
    this.logger.log("Processing ECE response files ...");
    const processingResult = await this.eceResponseProcessingService.process();
    this.logger.log("Processing ECE response files completed.");
    return processingResult;
  }

  @InjectLogger()
  logger: LoggerService;
}
