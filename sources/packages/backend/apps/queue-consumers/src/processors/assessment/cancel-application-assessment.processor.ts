import { Processor } from "@nestjs/bull";
import { Job } from "bull";
import { CancelAssessmentQueueInDTO } from "@sims/services/queue";
import {
  AssessmentSequentialProcessingService,
  DisbursementScheduleSharedService,
  SystemUsersService,
  WorkflowClientService,
} from "@sims/services";
import { CustomNamedError, QueueNames } from "@sims/utilities";
import { StudentAssessmentService } from "../../services";
import { DataSource } from "typeorm";
import { ZeebeGRPCError, ZeebeGRPCErrorTypes } from "@sims/services/zeebe";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import {
  ApplicationStatus,
  COEStatus,
  StudentAssessment,
  StudentAssessmentStatus,
} from "@sims/sims-db";
import { BaseQueue } from "../../processors";
import {
  ASSESSMENT_NOT_FOUND,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
} from "@sims/services/constants";

/**
 * Process the workflow cancellation.
 */
@Processor(QueueNames.CancelApplicationAssessment)
export class CancelApplicationAssessmentProcessor extends BaseQueue<CancelAssessmentQueueInDTO> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly workflowClientService: WorkflowClientService,
    private readonly studentAssessmentService: StudentAssessmentService,
    private readonly disbursementScheduleSharedService: DisbursementScheduleSharedService,
    private readonly assessmentSequentialProcessingService: AssessmentSequentialProcessingService,
    private readonly systemUserService: SystemUsersService,
  ) {
    super();
  }

  /**
   * Cancel the workflow instance and rollback overawards, if any.
   * @param job information to perform the process.
   * @param processSummary process summary for logging.
   * @returns processing result.   */
  protected async process(
    job: Job<CancelAssessmentQueueInDTO>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    processSummary.info(
      `Cancelling application assessment id ${job.data.assessmentId}`,
    );
    const assessment = await this.studentAssessmentService.getAssessmentById(
      job.data.assessmentId,
    );
    if (!assessment) {
      await job.discard();
      throw new CustomNamedError(
        `Assessment id ${job.data.assessmentId} was not found.`,
        ASSESSMENT_NOT_FOUND,
      );
    }

    if (
      assessment.studentAssessmentStatus !==
      StudentAssessmentStatus.CancellationQueued
    ) {
      await job.discard();
      const warnMessage = `Assessment id ${job.data.assessmentId} is not in ${StudentAssessmentStatus.CancellationQueued} status.`;
      processSummary.warn(warnMessage);
      return "Workflow cancellation process not executed due to the assessment cancellation not being in the correct status.";
    }

    if (
      ![ApplicationStatus.Cancelled, ApplicationStatus.Overwritten].includes(
        assessment.application.applicationStatus,
      )
    ) {
      await job.discard();
      const errorMessage = `Application must be in the ${ApplicationStatus.Cancelled} or ${ApplicationStatus.Overwritten} state to have the assessment cancelled.`;
      throw new CustomNamedError(
        errorMessage,
        INVALID_OPERATION_IN_THE_CURRENT_STATUS,
      );
    }

    // Try to cancel the workflow if a workflow id is present.
    if (assessment.assessmentWorkflowId) {
      processSummary.info(
        `Found workflow id ${assessment.assessmentWorkflowId}.`,
      );
      try {
        await this.workflowClientService.deleteApplicationAssessment(
          assessment.assessmentWorkflowId,
        );
        processSummary.info("Workflow instance successfully cancelled.");
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
        processSummary.warn(
          "Workflow instance was not cancelled because the workflow ID was not found on Camunda. " +
            "This can happen if the workflow was already completed or if it was cancelled, for instance, manually using the workflow UI. " +
            "This is not considered an error and the cancellation can proceed.",
        );
      }
    } else {
      // Unless there is some data integrity issue this scenario can happen only if the student application was submitted
      // and was never transitioned to the 'In Progress' state when the workflow instance is started.
      processSummary.warn(
        "Assessment was queued to be cancelled but there is no workflow ID associated with. " +
          "This is considered a normal scenario for cancellations that never transitioned to the 'In Progress' state.",
      );
    }
    return this.dataSource.transaction(async (transactionEntityManager) => {
      processSummary.info(
        `Changing student assessment status to ${StudentAssessmentStatus.Cancelled}.`,
      );
      await transactionEntityManager
        .getRepository(StudentAssessment)
        .update(assessment.id, {
          studentAssessmentStatus: StudentAssessmentStatus.Cancelled,
          modifier: this.systemUserService.systemUser,
          updatedAt: new Date(),
        });
      processSummary.info(
        `Assessment status updated to ${StudentAssessmentStatus.Cancelled}.`,
      );
      // Overawards rollback.
      // This method is safe to be called independently of the workflow state but it makes sense only after the
      // application moves from the 'In progress' status when the disbursements are generated.
      // It must be called after the workflow is cancelled to avoiding further updates on the disbursements after
      // the rollback is performed.
      processSummary.info("Rolling back overawards, if any.");
      await this.disbursementScheduleSharedService.rollbackOverawards(
        assessment.id,
        transactionEntityManager,
      );
      processSummary.info("Overawards rollback check executed.");
      // Check if the assessment has one of the COE(s) declined.
      const hasDeclinedCOE = assessment.disbursementSchedules.some(
        (disbursement) => disbursement.coeStatus === COEStatus.declined,
      );
      if (
        assessment.application.applicationStatus !==
          ApplicationStatus.Overwritten &&
        !hasDeclinedCOE
      ) {
        // Overwritten applications do not cause impacts in future application and the checks can be completely skipped.
        // If a COE of an application is declined, during the process of COE being declined,
        // the impacted application if exist is identified and reassessed.
        // Hence while cancelling an application with a declined COE, it must NOT be assessed for impacted application reassessment again.
        processSummary.info(
          "Assessing if there is a future impacted application that need to be reassessed.",
        );
        const impactedApplication =
          await this.assessmentSequentialProcessingService.assessImpactedApplicationReassessmentNeeded(
            job.data.assessmentId,
            this.systemUserService.systemUser.id,
            transactionEntityManager,
          );
        if (impactedApplication) {
          processSummary.info(
            `Application id ${impactedApplication.id} was detected as impacted and will be reassessed.`,
          );
        } else {
          processSummary.info(
            "No impacts were detected on future applications.",
          );
        }
      }
      return "Assessment cancelled with success.";
    });
  }

  @InjectLogger()
  logger: LoggerService;
}
