import { InjectQueue, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { QueueNames } from "@sims/utilities";
import {
  CRAIncomeVerificationService,
  SINValidationService,
} from "../../../services";
import { NotificationActionsService } from "@sims/services";
import { DataSource } from "typeorm/data-source/index.js";

@Processor(QueueNames.FileProcessingIssueNotifications)
export class FileProcessingIssueNotificationsScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.FileProcessingIssueNotifications)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly dataSource: DataSource,
    private readonly craIncomeVerificationService: CRAIncomeVerificationService,
    private readonly notificationActionsService: NotificationActionsService,
    private readonly sinValidationService: SINValidationService,
    logger: LoggerService,
  ) {
    super(schedulerQueue, queueService, logger);
  }

  /**
   * Process file processing issue notifications.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns processing result.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    const craPromise = this.craIncomeVerificationService.findOverdueResponses();
    const sinPromise = this.sinValidationService.findOverdueResponses();
    const [craOverdueResponses, sinOverdueResponses] = await Promise.all([
      craPromise,
      sinPromise,
    ]);

    craOverdueResponses.forEach((overdue) => {
      this.dataSource.transaction(async (entityManager) => {
        this.notificationActionsService.saveMinistryFileProcessingIssueNotification(
          {
            title: "CRA Income Verification Overdue Response",
            fileName: overdue.fileName,
            dateSent: overdue.dateSent,
            type: "CRA",
          },
          entityManager,
        );
      });
    });

    sinOverdueResponses.forEach((overdue) => {
      this.dataSource.transaction(async (entityManager) => {
        this.notificationActionsService.saveMinistryFileProcessingIssueNotification(
          {
            title: "SIN Validation Overdue Response",
            fileName: overdue.fileName,
            type: "SIN",
            dateSent: overdue.dateSent,
          },
          entityManager,
        );
      });
    });

    console.log("process summary", processSummary);

    return "Process finalized with success.";
  }
}
