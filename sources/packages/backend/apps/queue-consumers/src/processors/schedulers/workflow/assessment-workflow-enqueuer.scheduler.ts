import { InjectQueue, Processor } from "@nestjs/bull";
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
   * @param _job process job.
   * @param processSummary process summary for logging.
   * @returns processing result.
   */
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
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
    return "Process finalized with success.";
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

  /**
   * Setting the logger here allows the correct context to be set
   * during the property injection.
   * Even if the logger is not used, it is required to be set, to
   * allow the base classes to write logs using the correct context.
   */
  @InjectLogger()
  declare logger: LoggerService;
}
