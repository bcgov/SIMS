import { Processor } from "@nestjs/bull";
import { Job } from "bull";
import { StartAssessmentQueueInDTO } from "@sims/services/queue";
import { WorkflowClientService } from "@sims/services";
import { QueueNames } from "@sims/utilities";
import { StudentAssessmentService } from "../../services";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import { StudentAssessmentStatus } from "@sims/sims-db";
import { BaseQueue } from "../../processors";

/**
 * Process messages sent to start assessment queue.
 */
@Processor(QueueNames.StartApplicationAssessment)
export class StartApplicationAssessmentProcessor extends BaseQueue<StartAssessmentQueueInDTO> {
  constructor(
    private readonly workflowClientService: WorkflowClientService,
    private readonly studentAssessmentService: StudentAssessmentService,
  ) {
    super();
  }

  /**
   * Call Camunda to start the workflow.
   * @param job job details with assessment if and optional workflow name.
   * @param processSummary process summary for logging.
   * @returns processing result.
   */
  async process(
    job: Job<StartAssessmentQueueInDTO>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    const assessment = await this.studentAssessmentService.getAssessmentById(
      job.data.assessmentId,
    );
    if (assessment.studentAssessmentStatus !== StudentAssessmentStatus.Queued) {
      await job.discard();
      processSummary.warn(
        `Assessment id ${job.data.assessmentId} is not in ${StudentAssessmentStatus.Queued} status.`,
      );
      const endProcessMessage =
        "Workflow process not executed due to the assessment not being in the correct status.";
      processSummary.warn(endProcessMessage);
      return endProcessMessage;
    }
    let workflowName = job.data.workflowName;
    if (!workflowName) {
      const applicationData =
        await this.studentAssessmentService.getApplicationDynamicData(
          job.data.assessmentId,
        );
      workflowName = applicationData.workflowName;
    }
    processSummary.info(
      `Starting assessment id ${job.data.assessmentId} using workflow ${workflowName}.`,
    );
    await this.workflowClientService.startApplicationAssessment(
      workflowName,
      job.data.assessmentId,
    );
    return "Workflow call executed with success.";
  }

  @InjectLogger()
  logger: LoggerService;
}
