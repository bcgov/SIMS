import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { QueueNames } from "@sims/utilities";
import { QueueService } from "@sims/services/queue";
import { WorkflowEnqueuerService } from "../../../services";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import {
  getSuccessMessageWithAttentionCheck,
  logProcessSummaryToJobLogger,
} from "../../../utilities";

/**
 * Search for assessments that have some pending operation, for instance,
 * initialization or cancellation, and queue them.
 */
@Processor(QueueNames.AssessmentWorkflowEnqueuer)
export class AssessmentWorkflowEnqueuerScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.AssessmentWorkflowEnqueuer)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly workflowEnqueuerService: WorkflowEnqueuerService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Process all applications with pending assessments to be calculated.
   * @param job job information.
   * @returns processing result.
   */
  @Process()
  async enqueueAssessmentOperations(job: Job<void>): Promise<string[]> {
    const processSummary = new ProcessSummary();
    try {
      processSummary.info(
        "Checking application assessments to be queued for start.",
      );
      // Process summary to be populated by the enqueueStartAssessmentWorkflows.
      // In case an unexpected error happen the finally block will still be able to
      // output the partial information captured by the processSummary.
      const serviceProcessSummary = new ProcessSummary();
      processSummary.children(serviceProcessSummary);

      try {
        await this.workflowEnqueuerService.enqueueCancelAssessmentWorkflows(
          serviceProcessSummary,
        );
      } catch (error: unknown) {
        const errorMessage =
          "Unexpected error while enqueueing cancel assessment workflows.";
        processSummary.error(errorMessage, error);
      }
      try {
        await this.workflowEnqueuerService.enqueueStartAssessmentWorkflows(
          serviceProcessSummary,
        );
      } catch (error: unknown) {
        const errorMessage =
          "Unexpected error while enqueueing start assessment workflows.";
        processSummary.error(errorMessage, error);
      }
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

  @InjectLogger()
  logger: LoggerService;
}
