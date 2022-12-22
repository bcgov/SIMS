import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { DisbursementReceiptProcessingService } from "@sims/integrations/esdc-integration";
import { QueueService } from "@sims/services/queue";
import { SystemUsersService } from "@sims/services/system-users";
import { QueueNames } from "@sims/utilities";
import { Job, Queue } from "bull";
import { QueueProcessSummary } from "../../../models/processors.models";
import { BaseScheduler } from "../../base-scheduler";
import { ESDCFileResponse } from "../models/esdc.dto";

@Processor(QueueNames.FullTimeDisbursementReceiptsFileIntegration)
export class FullTimeDisbursementReceiptsFileIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.FullTimeDisbursementReceiptsFileIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly disbursementReceiptProcessingService: DisbursementReceiptProcessingService,
    private readonly systemUsersService: SystemUsersService,
  ) {
    super(schedulerQueue, queueService);
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
    const summary = new QueueProcessSummary({
      appLogger: this.logger,
      jobLogger: job,
    });
    await summary.info(
      `Processing CRA integration job ${job.id} of type ${job.name}.`,
    );
    const auditUser = await this.systemUsersService.systemUser();
    const processResponse =
      await this.disbursementReceiptProcessingService.process(auditUser.id);
    await this.cleanSchedulerQueueHistory();
    return processResponse.map((response) => ({
      processSummary: response.processSummary,
      errorsSummary: response.errorsSummary,
    }));
  }
}
