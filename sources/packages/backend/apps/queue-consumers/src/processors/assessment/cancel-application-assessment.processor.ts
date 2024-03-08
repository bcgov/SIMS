import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { CancelAssessmentQueueInDTO } from "@sims/services/queue";
import {
  AssessmentSequentialProcessingService,
  DisbursementScheduleSharedService,
  SystemUsersService,
  WorkflowClientService,
} from "@sims/services";
import { QueueNames } from "@sims/utilities";
import { StudentAssessmentService } from "../../services";
import { DataSource } from "typeorm";
import { ZeebeGRPCError, ZeebeGRPCErrorTypes } from "@sims/services/zeebe";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import {
  QueueProcessSummary,
  QueueProcessSummaryResult,
} from "../models/processors.models";
import {
  ApplicationStatus,
  COEStatus,
  StudentAssessment,
  StudentAssessmentStatus,
} from "@sims/sims-db";

/**
 * Process the workflow cancellation.
 */
@Processor(QueueNames.CancelApplicationAssessment)
export class CancelApplicationAssessmentProcessor {
  constructor(
    private readonly dataSource: DataSource,
    private readonly workflowClientService: WorkflowClientService,
    private readonly studentAssessmentService: StudentAssessmentService,
    private readonly disbursementScheduleSharedService: DisbursementScheduleSharedService,
    private readonly assessmentSequentialProcessingService: AssessmentSequentialProcessingService,
    private readonly systemUserService: SystemUsersService,
  ) {}

  /**
   * Cancel the workflow instance and rollback overawards, if any.
   * @param job information to perform the process.
   * @returns log message.
   */
  @Process()
  async cancelAssessment(
    job: Job<CancelAssessmentQueueInDTO>,
  ): Promise<QueueProcessSummaryResult> {
    const summary = new QueueProcessSummary({
      appLogger: this.logger,
      jobLogger: job,
    });
    await summary.info(
      `Cancelling application assessment id ${job.data.assessmentId}`,
    );
    const assessment = await this.studentAssessmentService.getAssessmentById(
      job.data.assessmentId,
    );
    if (!assessment) {
      await job.discard();
      const errorMessage = `Assessment id ${job.data.assessmentId} was not found.`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    if (
      assessment.studentAssessmentStatus !==
      StudentAssessmentStatus.CancellationQueued
    ) {
      await job.discard();
      const warnMessage = `Assessment id ${job.data.assessmentId} is not in ${StudentAssessmentStatus.CancellationQueued} status.`;
      summary.warn(warnMessage);
      summary.info(
        "Workflow cancellation process not executed due to the assessment cancellation not being in the correct status.",
      );
      return summary.getSummary();
    }

    if (
      ![ApplicationStatus.Cancelled, ApplicationStatus.Overwritten].includes(
        assessment.application.applicationStatus,
      )
    ) {
      await job.discard();
      const errorMessage = `Application must be in the ${ApplicationStatus.Cancelled} or ${ApplicationStatus.Overwritten} state to have the assessment cancelled.`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Try to cancel the workflow if a workflow id is present.
    // TODO: once the assessment has a proper status flag to be marked as completed we can check if the workflow needed to be cancelled.
    if (assessment.assessmentWorkflowId) {
      await summary.info(
        `Found workflow id ${assessment.assessmentWorkflowId}.`,
      );
      try {
        await this.workflowClientService.deleteApplicationAssessment(
          assessment.assessmentWorkflowId,
        );
        await summary.info("Workflow instance successfully cancelled.");
      } catch (error: unknown) {
        if (
          error instanceof ZeebeGRPCError &&
          error.code !== ZeebeGRPCErrorTypes.NOT_FOUND
        ) {
          // An unexpected error happen and the process must be aborted.
          this.logger.error(error);
          throw error;
        }
        // NOT_FOUND error means that the call to Camunda was successful but the workflow instance was not found.
        await summary.warn(
          "Workflow instance was not cancelled because the workflow id was not found on Camunda. " +
            "This can happen if the workflow was already completed or if it was cancelled, for instance, manually using the workflow UI. " +
            "This is not considered an error and the cancellation can proceed.",
        );
      }
    } else {
      // Unless there is some data integrity issue this scenario can happen only if the student application was submitted
      // and was never transitioned to the 'In Progress' state when the workflow instance is started.
      await summary.warn(
        "Assessment was queued to be cancelled but there is no workflow id associated with.",
      );
    }
    return this.dataSource.transaction(async (transactionEntityManager) => {
      await summary.info(
        `Changing student assessment status to ${StudentAssessmentStatus.Cancelled}.`,
      );
      await transactionEntityManager
        .getRepository(StudentAssessment)
        .update(assessment.id, {
          studentAssessmentStatus: StudentAssessmentStatus.Cancelled,
          modifier: this.systemUserService.systemUser,
          updatedAt: new Date(),
        });
      await summary.info(
        `Assessment status updated to ${StudentAssessmentStatus.Cancelled}.`,
      );
      // Overawards rollback.
      // This method is safe to be called independently of the workflow state but it makes sense only after the
      // application moves from the 'In progress' status when the disbursements are generated.
      // It must be called after the workflow is cancelled to avoiding further updates on the disbursements after
      // the rollback is performed.
      await summary.info("Rolling back overawards, if any.");
      await this.disbursementScheduleSharedService.rollbackOverawards(
        assessment.id,
        transactionEntityManager,
      );
      await summary.info("Overawards rollback check executed.");
      // Check if the assessment has no COE(s) which were declined.
      const hasNoDeclinedCOE = assessment.disbursementSchedules.every(
        (disbursement) => disbursement.coeStatus !== COEStatus.declined,
      );
      if (
        assessment.application.applicationStatus !==
          ApplicationStatus.Overwritten &&
        hasNoDeclinedCOE
      ) {
        // Overwritten applications do not cause impacts in future application and the checks can be completely skipped.
        // If a COE of an application is declined, during the process of COE being declined
        // impacted application if exist is identified and reassessed. And hence while cancelling
        // an application with a declined COE must NOT be assessed for impacted application reassessment again.
        await summary.info(
          "Assessing if there is a future impacted application that need to be reassessed.",
        );
        const impactedApplication =
          await this.assessmentSequentialProcessingService.assessImpactedApplicationReassessmentNeeded(
            job.data.assessmentId,
            this.systemUserService.systemUser.id,
            transactionEntityManager,
          );
        if (impactedApplication) {
          await summary.info(
            `Application id ${impactedApplication.id} was detected as impacted and will be reassessed.`,
          );
        } else {
          await summary.info(
            "No impacts were detected on future applications.",
          );
        }
      }
      await summary.info("Assessment cancelled with success.");
      return summary.getSummary();
    });
  }

  @InjectLogger()
  logger: LoggerService;
}
