import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { DisbursementReceiptProcessingService } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { SystemUsersService } from "@sims/services/system-users";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { ProcessSummary } from "@sims/utilities/logger";
import { BaseScheduler } from "../../base-scheduler";
import { ESDCFileResponse } from "../models/esdc.models";

@Processor(QueueNames.DisbursementReceiptsFileIntegration)
export class DisbursementReceiptsFileIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.DisbursementReceiptsFileIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly disbursementReceiptProcessingService: DisbursementReceiptProcessingService,
    private readonly systemUsersService: SystemUsersService,
  ) {
    super(schedulerQueue, queueService);
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

  /**
   * Process all the disbursement receipt files from remote sftp location.
   * @params job job details.
   * @returns Summary details of processing.
   */
  @Process()
  async processDisbursementReceipts(
    job: Job<void>,
  ): Promise<ESDCFileResponse[]> {
    const processSummary = new ProcessSummary();
    processSummary.info(
      `Processing full time disbursement receipts integration job ${job.id} of type ${job.name}.`,
    );
    const auditUser = this.systemUsersService.systemUser;
    const processResponse =
      await this.disbursementReceiptProcessingService.process(auditUser.id);
    processSummary.info(
      `Completed full time disbursement receipts integration job ${job.id} of type ${job.name}.`,
    );
    return processResponse.map((response) => ({
      processSummary: response.processSummary,
      errorsSummary: response.errorsSummary,
    }));
  }
}
