import { InjectQueue, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { QueueNames } from "@sims/utilities";
import { ApplicationChangesReportProcessingService } from "@sims/integrations/esdc-integration";

@Processor(QueueNames.ApplicationChangesReportIntegration)
export class ApplicationChangesReportIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.ApplicationChangesReportIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly applicationChangesReportProcessingService: ApplicationChangesReportProcessingService,
    logger: LoggerService,
  ) {
    super(schedulerQueue, queueService, logger);
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
}
