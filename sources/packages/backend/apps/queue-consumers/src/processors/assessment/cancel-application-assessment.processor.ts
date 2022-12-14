import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { CancelAssessmentQueueInDTO } from "@sims/services/queue";
import {
  DisbursementScheduleService,
  WorkflowClientService,
} from "@sims/services";
import { QueueNames } from "@sims/utilities";
import { StudentAssessmentService } from "../../services";
import { DataSource } from "typeorm";
import { ZeebeGRPCError, ZeebeGRPCErrorTypes } from "@sims/services/zeebe";

/**
 * Process the workflow cancellation.
 */
@Processor(QueueNames.CancelApplicationAssessment)
export class CancelApplicationAssessmentProcessor {
  constructor(
    private readonly dataSource: DataSource,
    private readonly workflowClientService: WorkflowClientService,
    private readonly studentAssessmentService: StudentAssessmentService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
  ) {}

  /**
   * Cancel the workflow instance and rollback overawards, if any.
   * @param job information to perform the process.
   * @returns log message.
   */
  @Process()
  async cancelAssessment(
    job: Job<CancelAssessmentQueueInDTO>,
  ): Promise<string> {
    await job.log(`Start processing, attempt ${job.attemptsMade + 1}.`);
    const assessment = await this.studentAssessmentService.getAssessmentById(
      job.data.assessmentId,
    );
    // Try to cancel the workflow if an workflow id is present.
    // TODO: once the assessment has a proper status flag to be marked as completed we can check if the workflow needed to be cancelled.
    if (assessment.assessmentWorkflowId) {
      await job.log(`Found workflow id ${assessment.assessmentWorkflowId}.`);
      try {
        await this.workflowClientService.deleteApplicationAssessment(
          assessment.assessmentWorkflowId,
        );
        await job.log(`Workflow instance successfully cancelled.`);
      } catch (error: unknown) {
        if (
          error instanceof ZeebeGRPCError &&
          error.code !== ZeebeGRPCErrorTypes.NOT_FOUND
        ) {
          // An unexpected error happen and the process must be aborted.
          throw error;
        }
        // NOT_FOUND error means that the call to Camunda was successful but the workflow instance was not found.
        await job.log(
          "Workflow instance was not cancelled because the workflow id was not found on Camunda. " +
            "This can happen if the workflow was already completed or if it was cancelled, for instance, manually using the workflow UI. " +
            "This is not considered an error and the cancellation can proceed.",
        );
      }
    } else {
      // Unless there is some data integrity issue this scenario can happen only if the student application was submitted
      // and was never transitioned to the 'In Progress' state when the workflow instance is started.
      await job.log(
        "Assessment was queued to be cancelled but there is no workflow id associated with.",
      );
    }
    return this.dataSource.transaction(async (transactionEntityManager) => {
      // Overawards rollback.
      // This method is safe to be called independently of the workflow state but it makes sense only after the
      // application moves from the 'In progress' status when the disbursements are generated.
      // It must be called after the workflow is cancelled to avoiding further updates on the disbursements after
      // the rollback is performed.
      await job.log("Rolling back overawards, if any.");
      await this.disbursementScheduleService.rollbackOverawards(
        assessment.id,
        transactionEntityManager,
      );
      return "Assessment cancelled with success.";
    });
  }
}
