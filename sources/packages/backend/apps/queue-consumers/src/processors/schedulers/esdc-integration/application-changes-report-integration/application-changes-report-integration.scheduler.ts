import { InjectQueue, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import { QueueNames } from "@sims/utilities";
import { ApplicationChangesReportProcessingService } from "@sims/integrations/esdc-integration";

@Processor(QueueNames.ApplicationChangesReportIntegration)
export class ApplicationChangesReportIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.ApplicationChangesReportIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly applicationChangesReportProcessingService: ApplicationChangesReportProcessingService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Generate application changes report for the applications which has at least one e-Cert sent
   * and the application study dates have changed after the first e-Cert
   * or after the last time the application was reported for study dates change
   * through application changes report. Once generated upload the report to the ESDC directory
   * in SFTP server.
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns process summary.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string[]> {
    const { applicationsReported, uploadedFileName } =
      await this.applicationChangesReportProcessingService.processApplicationChanges(
        processSummary,
      );
    return [
      `Applications reported: ${applicationsReported}`,
      `Uploaded file name: ${uploadedFileName}`,
    ];
  }

  /**
   * Setting the logger here allows the correct context to be set
   * during the property injection.
   * Even if the logger is not used, it is required to be set, to
   * allow the base classes to write logs using the correct context.
   */
  @InjectLogger()
  logger: LoggerService;
}
