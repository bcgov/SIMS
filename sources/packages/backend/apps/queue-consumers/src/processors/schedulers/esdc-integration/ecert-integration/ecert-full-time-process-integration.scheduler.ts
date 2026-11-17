import { Processor } from "@nestjs/bullmq";
import { BaseQueueProcessor } from "../../base-queue-processor";
import { FullTimeECertFileHandler } from "@sims/integrations/esdc-integration";
import { QueueNames } from "@sims/utilities";
import { FullTimeCalculationProcess } from "@sims/integrations/services/disbursement-schedule/e-cert-calculation";
import { ECertProcessIntegrationBaseScheduler } from "./ecert-process-integration-base.scheduler";
import { LoggerService } from "@sims/utilities/logger";

@Processor(
  QueueNames.FullTimeECertIntegration,
  BaseQueueProcessor.defaultWorkerOptions,
)
export class FullTimeECertProcessIntegrationScheduler extends ECertProcessIntegrationBaseScheduler {
  constructor(
    fullTimeCalculationProcess: FullTimeCalculationProcess,
    fullTimeECertFileHandler: FullTimeECertFileHandler,
    logger: LoggerService,
  ) {
    super(fullTimeCalculationProcess, fullTimeECertFileHandler, logger);
  }
}
