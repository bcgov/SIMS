import { InjectQueue, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { CASSupplierIntegrationService } from "../../../services";

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
   * Scheduler for CAS supplier information process.
   * Checks for pending supplier information for students, request it to CAS and update the data to CAS supplier table.
   * @returns process summary.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string | string[]> {
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

  @InjectLogger()
  logger: LoggerService;
}
