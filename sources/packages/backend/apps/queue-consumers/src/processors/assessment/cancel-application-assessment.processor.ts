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
import {
  ZeebeGRPCError,
  ZeebeGRPCErrorTypes,
} from "@sims/services/zeebe/zeebe.models";

/**
 * Process messages sent to cancel assessment queue.
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
    await job.log(`Start processing, attempt ${job.attemptsMade}.`);
    const assessment = await this.studentAssessmentService.getAssessmentById(
      job.data.assessmentId,
    );
    return this.dataSource.transaction(async (transactionEntityManager) => {
      if (assessment.assessmentWorkflowId) {
        await job.log(`Found workflow id ${assessment.assessmentWorkflowId}.`);
        try {
          await this.workflowClientService.deleteApplicationAssessment(
            assessment.assessmentWorkflowId,
          );
        } catch (error: unknown) {
          if (
            error instanceof ZeebeGRPCError &&
            error.code !== ZeebeGRPCErrorTypes.NOT_FOUND
          ) {
            // An unexpected error happen and the process must be aborted.
            throw error;
          }
          // NOT_FOUND error means that the call to Camunda was successful but the workflow instance was not found.
          // If not found, it is probably due to a manual cancellation, in this case, since the instance is already cancelled
          // we allow the code to proceed and check if any overaward must be rolled back.
          await job.log(
            `Workflow not cancelled because the workflow id was not found on Camunda. This can happen if the workflow was cancelled due to some other interaction method (e.g. manually).`,
          );
        }
      } else {
        // Unless there is some data integrity issue this scenario can happen only if the student application was submitted
        // and was never transitioned to the 'In Progress' state when the workflow instance is started.
        await job.log(
          "Assessment was queued to be cancelled but there is no workflow id associated with.",
        );
      }
      // Overawards rollback.
      // This method is safe to be called independently of the workflow state but it makes sense only after the
      // application moves from the 'In progress' status when the disbursements are generated.
      await this.disbursementScheduleService.rollbackOverawards(
        assessment.id,
        transactionEntityManager,
      );
      return "Assessment cancelled with success.";
    });
  }
}
