import { Processor } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { BaseQueueProcessor } from "../../base-queue-processor";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { QueueNames } from "@sims/utilities";
import { ApplicationChangesReportProcessingService } from "@sims/integrations/esdc-integration";

@Processor(
  QueueNames.ApplicationChangesReportIntegration,
  BaseQueueProcessor.defaultWorkerOptions,
)
export class ApplicationChangesReportIntegrationScheduler extends BaseQueueProcessor<void> {
  constructor(
    private readonly applicationChangesReportProcessingService: ApplicationChangesReportProcessingService,
    logger: LoggerService,
  ) {
    super(logger);
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
  protected async processQueue(
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
