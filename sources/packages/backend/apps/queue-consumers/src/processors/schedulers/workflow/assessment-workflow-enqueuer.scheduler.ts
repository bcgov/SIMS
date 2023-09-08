import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { QueueNames } from "@sims/utilities";
import { QueueService } from "@sims/services/queue";
import {
  QueueProcessSummary,
  QueueProcessSummaryResult,
} from "../../models/processors.models";
import { WorkflowEnqueuerService } from "../../../services";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";

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
   * Process all the applied disability status requests by students.
   * @param job job information.
   * @returns processing result.
   */
  @Process()
  async enqueueAssessmentOperations(
    job: Job<void>,
  ): Promise<QueueProcessSummaryResult> {
    const summary = new QueueProcessSummary({
      appLogger: this.logger,
      jobLogger: job,
    });
    await summary.info(
      "Checking application assessments to be queued for start.",
    );
    await this.workflowEnqueuerService.enqueueStartAssessmentWorkflows(summary);
    await summary.info("All application assessments queued.");
    await this.cleanSchedulerQueueHistory();
    return summary.getSummary();
  }

  @InjectLogger()
  logger: LoggerService;
}
