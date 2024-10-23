import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { CustomNamedError, QueueNames } from "@sims/utilities";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { CASSupplierIntegrationService } from "../../../services";
import {
  logProcessSummaryToJobLogger,
  getSuccessMessageWithAttentionCheck,
} from "../../../utilities";

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
  @Process()
  async processCASSupplierInformation(job: Job<void>): Promise<string[]> {
    const processSummary = new ProcessSummary();

    try {
      this.logger.log(
        `Processing CAS supplier integration job ${job.id} of type ${job.name}.`,
      );
      processSummary.info("Executing CAS supplier integration...");
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
      return getSuccessMessageWithAttentionCheck(
        [
          "Process finalized with success.",
          `Pending suppliers to update found: ${pendingCASSuppliers.length}.`,
          `Records updated: ${suppliersUpdated}.`,
        ],
        processSummary,
        { throwOnError: true },
      );
    } catch (error: unknown) {
      // Throw an error to force the queue to retry.
      if (error instanceof CustomNamedError) {
        throw new Error(error.message);
      }
      throw new Error("Unexpected error while executing the job.", {
        cause: error,
      });
    } finally {
      this.logger.logProcessSummary(processSummary);
      await logProcessSummaryToJobLogger(processSummary, job);
      await this.cleanSchedulerQueueHistory();
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
