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
   * To be removed once the method {@link process} is implemented.
   * This method "hides" the {@link Process} decorator from the base class.
   */
  async processQueue(): Promise<string | string[]> {
    throw new Error("Method not implemented.");
  }

  /**
   * When implemented in a derived class, process the queue job.
   * To be implemented.
   */
  protected async process(): Promise<string | string[]> {
    throw new Error("Method not implemented.");
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
      // Check for applications with assessments to be cancelled.
      await this.executeEnqueueProcess(
        processSummary,
        this.workflowEnqueuerService.enqueueCancelAssessmentWorkflows.bind(
          this.workflowEnqueuerService,
        ),
      );
      // Check for applications with assessments to be started.
      await this.executeEnqueueProcess(
        processSummary,
        this.workflowEnqueuerService.enqueueStartAssessmentWorkflows.bind(
          this.workflowEnqueuerService,
        ),
      );
      return getSuccessMessageWithAttentionCheck(
        ["Process finalized with success."],
        processSummary,
      );
    } catch (error: unknown) {
      const errorMessage = "Unexpected error while executing the job.";
      processSummary.error(errorMessage, error);
      return [errorMessage];
    } finally {
      this.logger.logProcessSummary(processSummary);
      await logProcessSummaryToJobLogger(processSummary, job);
    }
  }

  /**
   * Enqueues the process and creates a new process summary for the queue process.
   * @param parentProcessSummary parent process summary.
   * @param enqueueProcess enqueue process function to be called.
   */
  private async executeEnqueueProcess(
    parentProcessSummary: ProcessSummary,
    enqueueProcess: (summary: ProcessSummary) => Promise<void>,
  ): Promise<void> {
    try {
      // Process summary to be populated by each enqueueing workflow call.
      // In case an unexpected error happen the finally block will still be able to
      // output the partial information captured by the processSummary.
      const serviceProcessSummary = new ProcessSummary();
      parentProcessSummary.children(serviceProcessSummary);
      await enqueueProcess(serviceProcessSummary);
    } catch (error: unknown) {
      const errorMessage =
        "Unexpected error while enqueueing start assessment workflows.";
      parentProcessSummary.error(errorMessage, error);
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
