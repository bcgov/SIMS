import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { QueueService } from "@sims/services/queue";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import {
  getSuccessMessageWithAttentionCheck,
  logProcessSummaryToJobLogger,
} from "../../../../utilities";
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

  processQueue(job: Job<void>): Promise<string | string[]> {
    throw new Error("Method not implemented.");
  }

  process(
    _job: Job<void>,
    _processSummary: ProcessSummary,
  ): Promise<string | string[]> {
    throw new Error("Method not implemented.");
  }

  /**
   * Generate application changes report for the applications which has at least one e-Cert sent
   * and the application study dates have changed after the first e-Cert
   * or after the last time the application was reported for study dates change
   * through application changes report. Once generated upload the report to the ESDC directory
   * in SFTP server.
   * @param job job.
   * @returns process summary.
   */
  @Process()
  async processApplicationChanges(job: Job<void>): Promise<string[]> {
    const processSummary = new ProcessSummary();

    try {
      processSummary.info(
        `Processing application changes report integration job. Job id: ${job.id} and Job name: ${job.name}.`,
      );
      const integrationProcessSummary = new ProcessSummary();
      processSummary.children(integrationProcessSummary);
      const { applicationsReported, uploadedFileName } =
        await this.applicationChangesReportProcessingService.processApplicationChanges(
          integrationProcessSummary,
        );
      return getSuccessMessageWithAttentionCheck(
        [
          "Process finalized with success.",
          `Applications reported: ${applicationsReported}`,
          `Uploaded file name: ${uploadedFileName}`,
        ],
        processSummary,
      );
    } catch (error: unknown) {
      // Translate to friendly error message.
      const errorMessage =
        "Unexpected error while executing the job to process application changes.";
      processSummary.error(errorMessage, error);
      throw new Error(errorMessage, { cause: error });
    } finally {
      this.logger.logProcessSummary(processSummary);
      await logProcessSummaryToJobLogger(processSummary, job);
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
