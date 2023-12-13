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

  @InjectLogger()
  logger: LoggerService;
}
