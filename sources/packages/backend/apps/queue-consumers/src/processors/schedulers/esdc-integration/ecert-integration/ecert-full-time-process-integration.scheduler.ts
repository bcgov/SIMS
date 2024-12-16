import { InjectQueue, Processor } from "@nestjs/bull";
import { FullTimeECertFileHandler } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Queue } from "bull";
import { FullTimeCalculationProcess } from "@sims/integrations/services/disbursement-schedule/e-cert-calculation";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { ECertProcessIntegrationBaseScheduler } from "./ecert-process-integration-base.scheduler";

@Processor(QueueNames.FullTimeECertIntegration)
export class FullTimeECertProcessIntegrationScheduler extends ECertProcessIntegrationBaseScheduler {
  constructor(
    @InjectQueue(QueueNames.FullTimeECertIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    fullTimeCalculationProcess: FullTimeCalculationProcess,
    fullTimeECertFileHandler: FullTimeECertFileHandler,
  ) {
    super(
      schedulerQueue,
      queueService,
      fullTimeCalculationProcess,
      fullTimeECertFileHandler,
    );
  }

  /**
   * To be removed once the method {@link process} is implemented.
   * This method "hides" the {@link Process} decorator from the base class.
   */
  async processQueue(): Promise<string | string[]> {
    throw new Error("Method not implemented.");
  }

  /**
   * When implemented in a derived class, process the queue job.
   * To be implemented.
   */
  protected async process(): Promise<string | string[]> {
    throw new Error("Method not implemented.");
  }

  @InjectLogger()
  logger: LoggerService;
}
