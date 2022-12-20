import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { DisbursementReceiptProcessingService } from "@sims/integrations/esdc-integration/disbursement-receipt-integration/disbursement-receipt-processing.service";
import { QueueService } from "@sims/services/queue";
import { SystemUsersService } from "@sims/services/system-users";
import { QueueNames } from "@sims/utilities";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { ESDCFileResponseQueueOutDTO } from "../models/esdc.dto";

@Processor(QueueNames.FullTimeDisbursementReceiptsFileIntegration)
export class FullTimeDisbursementReceiptsFileIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.FullTimeDisbursementReceiptsFileIntegration)
    protected readonly schedulerQueue: Queue<void>,
    protected readonly queueService: QueueService,
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
  ): Promise<ESDCFileResponseQueueOutDTO[]> {
    this.logger.log(
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

  @InjectLogger()
  logger: LoggerService;
}
