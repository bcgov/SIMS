import { InjectQueue, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { addHours, QueueNames } from "@sims/utilities";
import { QueueService } from "@sims/services/queue";
import { WorkflowEnqueuerService } from "../../../services";
import {} from "../../models/processors.models";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import { AssessmentWorkflowQueueRetryInDTO } from "./models/assessment-workflow-queue-retry.dto";

/**
 * Retry assessments.
 */
@Processor(QueueNames.AssessmentWorkflowQueueRetry)
export class WorkflowQueueRetryScheduler extends BaseScheduler<AssessmentWorkflowQueueRetryInDTO> {
  constructor(
    @InjectQueue(QueueNames.AssessmentWorkflowQueueRetry)
    schedulerQueue: Queue<AssessmentWorkflowQueueRetryInDTO>,
    queueService: QueueService,
    private readonly workflowEnqueuerService: WorkflowEnqueuerService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Process all assessments that were not processed in a period of time.
   * @param job process job.
   * @param processSummary process summary for logging.
   * @returns processing result.
   */
  protected async process(
    job: Job<AssessmentWorkflowQueueRetryInDTO>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    // Check for assessments cancellations to be retried.
    await this.executeEnqueueProcess(
      job.data.amountHoursAssessmentRetry,
      processSummary,
      this.workflowEnqueuerService.enqueueCancelAssessmentRetryWorkflows.bind(
        this.workflowEnqueuerService,
      ),
    );
    // Check for assessments to be started.
    await this.executeEnqueueProcess(
      job.data.amountHoursAssessmentRetry,
      processSummary,
      this.workflowEnqueuerService.enqueueStartAssessmentRetryWorkflows.bind(
        this.workflowEnqueuerService,
      ),
    );
    return "Process finalized with success.";
  }

  /**
   * Enqueues the process and creates a new process summary for the queue process.
   * @param amountHoursAssessmentRetry amount of hours for the assessment to be retried.
   * @param parentProcessSummary parent process summary.
   * @param enqueueProcess enqueue process function to be called.
   */
  private async executeEnqueueProcess(
    amountHoursAssessmentRetry: number,
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
      const retryMaxDate = addHours(-amountHoursAssessmentRetry);
      await enqueueProcess(serviceProcessSummary, retryMaxDate);
    } catch (error: unknown) {
      const errorMessage =
        "Unexpected error while enqueueing assessment workflows.";
      parentProcessSummary.error(errorMessage, error);
    }
  }

  /**
   * Builds the payload for the job.
   * @returns payload.
   */
  protected async payload(): Promise<AssessmentWorkflowQueueRetryInDTO> {
    const amountHoursAssessmentRetry =
      await this.queueService.getAmountHoursAssessmentRetry(
        this.schedulerQueue.name as QueueNames,
      );
    return { amountHoursAssessmentRetry };
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
