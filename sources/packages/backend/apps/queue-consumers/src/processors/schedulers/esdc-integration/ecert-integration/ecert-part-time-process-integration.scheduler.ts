import { InjectQueue, Processor } from "@nestjs/bull";
import { PartTimeECertFileHandler } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Queue } from "bull";
import { PartTimeCalculationProcess } from "@sims/integrations/services/disbursement-schedule/e-cert-calculation";
import { ECertProcessIntegrationBaseScheduler } from "./ecert-process-integration-base.scheduler";
import { LoggerService } from "@sims/utilities/logger";

@Processor(QueueNames.PartTimeECertIntegration)
export class PartTimeECertProcessIntegrationScheduler extends ECertProcessIntegrationBaseScheduler {
  constructor(
    @InjectQueue(QueueNames.PartTimeECertIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    partTimeCalculationProcess: PartTimeCalculationProcess,
    partTimeECertFileHandler: PartTimeECertFileHandler,
    logger: LoggerService,
  ) {
    super(
      schedulerQueue,
      queueService,
      partTimeCalculationProcess,
      partTimeECertFileHandler,
      logger,
    );
  }
}
