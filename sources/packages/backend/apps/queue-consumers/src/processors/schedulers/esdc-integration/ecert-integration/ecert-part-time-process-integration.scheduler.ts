import { Processor } from "@nestjs/bullmq";
import { BaseQueueProcessor } from "../../base-queue-processor";
import { PartTimeECertFileHandler } from "@sims/integrations/esdc-integration";
import { QueueNames } from "@sims/utilities";
import { PartTimeCalculationProcess } from "@sims/integrations/services/disbursement-schedule/e-cert-calculation";
import { ECertProcessIntegrationBaseScheduler } from "./ecert-process-integration-base.scheduler";
import { LoggerService } from "@sims/utilities/logger";

@Processor(
  QueueNames.PartTimeECertIntegration,
  BaseQueueProcessor.defaultWorkerOptions,
)
export class PartTimeECertProcessIntegrationScheduler extends ECertProcessIntegrationBaseScheduler {
  constructor(
    partTimeCalculationProcess: PartTimeCalculationProcess,
    partTimeECertFileHandler: PartTimeECertFileHandler,
    logger: LoggerService,
  ) {
    super(partTimeCalculationProcess, partTimeECertFileHandler, logger);
  }
}
