import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { CASSupplierIntegrationService } from "../../../services";
import { CASSupplierIntegrationResult } from "./models/cas-supplier-integration-result.dto";

@Processor(QueueNames.CASSupplierIntegration)
export class CASSupplierIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.CASSupplierIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly casSupplierIntegrationService: CASSupplierIntegrationService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   *
   */
  @Process()
  async processCASSupplierInformation(
    job: Job<void>,
  ): Promise<CASSupplierIntegrationResult> {
    this.logger.log(
      `Processing CAS supplier integration job ${job.id} of type ${job.name}.`,
    );
    this.logger.log("Executing CAS supplier integration...");
    const result =
      await this.casSupplierIntegrationService.executeCASIntegrationProcess();
    this.logger.log("CAS supplier integration executed.");
    await this.cleanSchedulerQueueHistory();
    return {
      test: "ok",
    };
  }

  @InjectLogger()
  logger: LoggerService;
}
