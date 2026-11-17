import { Processor } from "@nestjs/bullmq";
import { QueueNames } from "@sims/utilities";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { Job } from "bullmq";
import { BaseQueueProcessor } from "../base-queue-processor";
import { CASSupplierIntegrationService } from "../../../services";

@Processor(
  QueueNames.CASSupplierIntegration,
  BaseQueueProcessor.defaultWorkerOptions,
)
export class CASSupplierIntegrationScheduler extends BaseQueueProcessor<void> {
  constructor(
    private readonly casSupplierIntegrationService: CASSupplierIntegrationService,
    logger: LoggerService,
  ) {
    super(logger);
  }

  /**
   * Scheduler for CAS supplier information process.
   * Checks for pending supplier information for students, request it to CAS and update the data to CAS supplier table.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns process summary.
   */
  protected async processQueue(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string[]> {
    processSummary.info("Executing CAS supplier integration.");
    const pendingCASSuppliers =
      await this.casSupplierIntegrationService.getStudentsToUpdateSupplierInformation();
    processSummary.info(
      `Found ${pendingCASSuppliers.length} records to be updated.`,
    );
    let suppliersUpdated = 0;
    if (pendingCASSuppliers.length) {
      const serviceProcessSummary = new ProcessSummary();
      processSummary.children(serviceProcessSummary);
      suppliersUpdated =
        await this.casSupplierIntegrationService.executeCASIntegrationProcess(
          serviceProcessSummary,
          pendingCASSuppliers,
        );
    }
    processSummary.info("CAS supplier integration executed.");
    return [
      "Process finalized with success.",
      `Pending suppliers to update found: ${pendingCASSuppliers.length}.`,
      `Records updated: ${suppliersUpdated}.`,
    ];
  }
}
