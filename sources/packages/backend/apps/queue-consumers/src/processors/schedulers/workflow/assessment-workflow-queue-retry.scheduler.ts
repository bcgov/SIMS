import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { addHours, QueueNames } from "@sims/utilities";
import { QueueService } from "@sims/services/queue";
import {
  StudentAssessmentService,
  WorkflowEnqueuerService,
} from "../../../services";
import {} from "../../models/processors.models";
import { SystemUsersService } from "@sims/services/system-users";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import {
  getSuccessMessageWithAttentionCheck,
  logProcessSummaryToJobLogger,
} from "../../../utilities";
import { QueueConfiguration } from "@sims/sims-db";

/**
 * Retry assessments.
 */
@Processor(QueueNames.AssessmentWorkflowQueueRetry)
export class AssessmentWorkflowQueueRetryScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.AssessmentWorkflowQueueRetry)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly workflowEnqueuerService: WorkflowEnqueuerService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Process all assessments that were not processed in a period of time.
   * @param job job information.
   * @returns processing result.
   */
  @Process()
  async enqueueAssessmentRetryOperations(job: Job<void>): Promise<string[]> {
    const processSummary = new ProcessSummary();
    try {
      processSummary.info("Checking assessments to be queued for retry.");
      // Check for assessments cancellations to be retried.
      await this.executeEnqueueProcess(
        processSummary,
        this.workflowEnqueuerService.enqueueCancelAssessmentRetryWorkflows.bind(
          this.workflowEnqueuerService,
        ),
      );
      // Check for assessments to be started.
      await this.executeEnqueueProcess(
        processSummary,
        this.workflowEnqueuerService.enqueueStartAssessmentRetryWorkflows.bind(
          this.workflowEnqueuerService,
        ),
      );
      return getSuccessMessageWithAttentionCheck(
        "Process finalized with success.",
        processSummary,
      );
    } catch (error: unknown) {
      const errorMessage = "Unexpected error while executing the job.";
      processSummary.error(errorMessage, error);
      return [errorMessage];
    } finally {
      this.logger.logProcessSummary(processSummary);
      await logProcessSummaryToJobLogger(processSummary, job);
      await this.cleanSchedulerQueueHistory();
    }
  }

  /**
   * Enqueues the process and creates a new process summary for the queue process.
   * @param parentProcessSummary parent process summary.
   * @param enqueueProcess enqueue process function to be called.
   */
  private async executeEnqueueProcess(
    parentProcessSummary: ProcessSummary,
    enqueueProcess: (
      summary: ProcessSummary,
      retryMaxDate: Date,
    ) => Promise<void>,
  ): Promise<void> {
    try {
      // Process summary to be populated by each enqueueing workflow call.
      // In case an unexpected error happen the finally block will still be able to
      // output the partial information captured by the processSummary.
      const serviceProcessSummary = new ProcessSummary();
      parentProcessSummary.children(serviceProcessSummary);

      const queueConfig: QueueConfiguration =
        await this.queueService.queueConfigurationDetails(
          this.schedulerQueue.name as QueueNames,
        );
      const retryMaxDate = addHours(
        -queueConfig.queueConfiguration.amountHoursAssessmentRetry,
      );
      await enqueueProcess(serviceProcessSummary, retryMaxDate);
    } catch (error: unknown) {
      const errorMessage =
        "Unexpected error while enqueueing start assessment workflows.";
      parentProcessSummary.error(errorMessage, error);
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
