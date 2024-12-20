import { InjectQueue, Processor } from "@nestjs/bull";
import { PartTimeECertFileHandler } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Queue } from "bull";
import { PartTimeCalculationProcess } from "@sims/integrations/services/disbursement-schedule/e-cert-calculation";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { ECertProcessIntegrationBaseScheduler } from "./ecert-process-integration-base.scheduler";

@Processor(QueueNames.PartTimeECertIntegration)
export class PartTimeECertProcessIntegrationScheduler extends ECertProcessIntegrationBaseScheduler {
  constructor(
    @InjectQueue(QueueNames.PartTimeECertIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    partTimeCalculationProcess: PartTimeCalculationProcess,
    partTimeECertFileHandler: PartTimeECertFileHandler,
  ) {
    super(
      schedulerQueue,
      queueService,
      partTimeCalculationProcess,
      partTimeECertFileHandler,
    );
  }

  /**
   * Setting the logger here allows the correct context to be set
   * during the property injection.
   * Even if the logger is not used, it is required to be set, to
   * allow the base classes to write logs using the correct context.
   */
  @InjectLogger()
  logger: LoggerService;
}
