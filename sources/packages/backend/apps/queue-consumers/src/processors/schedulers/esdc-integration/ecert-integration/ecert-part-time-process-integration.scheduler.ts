import { InjectQueue, Processor } from "@nestjs/bull";
import { PartTimeECertFileHandler } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { PartTimeCalculationProcess } from "@sims/integrations/services/disbursement-schedule/e-cert-calculation";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
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

  processQueue(job: Job<void>): Promise<string | string[]> {
    throw new Error("Method not implemented.");
  }

  async process(
    _job: Job<void>,
    _processSummary: ProcessSummary,
  ): Promise<string | string[]> {
    throw new Error("Method not implemented.");
  }

  @InjectLogger()
  logger: LoggerService;
}
