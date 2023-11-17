import { Process, Processor } from "@nestjs/bull";
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
import { logProcessSummaryToJobLogger } from "../../utilities";
import { StudentAssessmentStatus } from "@sims/sims-db";

/**
 * Process messages sent to start assessment queue.
 */
@Processor(QueueNames.StartApplicationAssessment)
export class StartApplicationAssessmentProcessor {
  constructor(
    private readonly workflowClientService: WorkflowClientService,
    private readonly studentAssessmentService: StudentAssessmentService,
  ) {}

  /**
   * Call Camunda to start the workflow.
   * @param job job details with assessment if and optional workflow name.
   * @returns process summary.
   */
  @Process()
  async startAssessment(job: Job<StartAssessmentQueueInDTO>): Promise<string> {
    const processSummary = new ProcessSummary();
    try {
      processSummary.info("Processing the start assessment job.");
      const assessment = await this.studentAssessmentService.getAssessmentById(
        job.data.assessmentId,
      );
      if (
        assessment.studentAssessmentStatus !== StudentAssessmentStatus.Queued
      ) {
        await job.discard();
        processSummary.warn(
          `Assessment id ${job.data.assessmentId} is not in ${StudentAssessmentStatus.Queued} status.`,
        );
        const endProcessMessage =
          "Workflow process not executed due to the assessment not being in the correct status.";
        processSummary.info(endProcessMessage);
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
      const successMessage = "Workflow call executed with success.";
      return successMessage;
    } catch (error) {
      processSummary.error("Unexpected error while executing the job.", error);
      return "Unexpected error while executing the job, check logs for further details.";
    } finally {
      this.logger.logProcessSummary(processSummary);
      await logProcessSummaryToJobLogger(processSummary, job);
      // Todo: add queue history cleaning logic as in schedulers.
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
