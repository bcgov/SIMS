import { Injectable } from "@nestjs/common";
import { ApplicationService } from "..";
import { Queue } from "bull";
import {
  CancelAssessmentQueueInDTO,
  StartAssessmentQueueInDTO,
} from "@sims/services/queue";
import { InjectQueue } from "@nestjs/bull";
import { QueueNames, processInParallel } from "@sims/utilities";
import {
  Application,
  StudentAssessment,
  StudentAssessmentStatus,
} from "@sims/sims-db";
import { DataSource } from "typeorm";
import { ProcessSummary } from "@sims/utilities/logger";
import { SystemUsersService } from "@sims/services";

/**
 * Manages the operations to search assessments that requires some
 * workflow operations, for instance, triggering their start or cancellation.
 */
@Injectable()
export class WorkflowEnqueuerService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly applicationService: ApplicationService,
    private readonly systemUsersService: SystemUsersService,
    @InjectQueue(QueueNames.StartApplicationAssessment)
    private readonly startAssessmentQueue: Queue<StartAssessmentQueueInDTO>,
    @InjectQueue(QueueNames.CancelApplicationAssessment)
    private readonly cancelAssessmentQueue: Queue<CancelAssessmentQueueInDTO>,
  ) {}

  /**
   * Search applications with pending assessments to be processed by the assessment workflow.
   * If no other assessment is being processed for that application the oldest pending
   * assessment will be queue for start.
   * @param summary process summary to group all the logs.
   */
  async enqueueStartAssessmentWorkflows(
    summary: ProcessSummary,
  ): Promise<void> {
    try {
      summary.info(
        "Checking database for applications with assessments waiting to be triggered.",
      );
      const applications =
        await this.applicationService.getApplicationsToStartAssessments();
      summary.info(`Found ${applications.length} applications.`);
      if (!applications.length) {
        return;
      }
      const children = await processInParallel(
        (application: Application) => this.queueNextAssessment(application),
        applications,
      );
      summary.children(...children);
      summary.info("All assessments were processed.");
    } catch (error: unknown) {
      summary.error(
        "Error while enqueueing assessment workflows to be processed.",
        error,
      );
    }
  }

  /**
   * Search applications with pending assessments to be processed by the assessment workflow.
   * If no other assessment is being processed for that application the oldest pending
   * assessment will be queue for start.
   * @param summary process summary to group all the logs.
   */
  async enqueueCancelAssessmentWorkflows(
    summary: ProcessSummary,
  ): Promise<void> {
    try {
      summary.info(
        "Checking database for applications with assessments waiting to be canceled.",
      );
      const applications =
        await this.applicationService.getApplicationsToCancelAssessments();
      summary.info(`Found ${applications.length} applications.`);
      if (!applications.length) {
        return;
      }
      const children = await processInParallel(
        (application: Application) =>
          this.queueAssessmentCancellation(application),
        applications,
      );
      summary.children(...children);
      summary.info("All assessments were processed.");
    } catch (error: unknown) {
      summary.error(
        "Error while enqueueing assessments to be canceled.",
        error,
      );
    }
  }

  /**
   * Queue the next pending assessment for an application.
   * @param application application with pending assessments.
   * @returns process summary.
   */
  private async queueNextAssessment(
    application: Application,
  ): Promise<ProcessSummary> {
    const summary = new ProcessSummary();
    try {
      summary.info(
        `Queueing next pending assessment for application id ${application.id}.`,
      );
      const [nextAssessment] = application.studentAssessments;
      summary.info(
        `Found ${application.studentAssessments.length} pending assessment(s). Queueing assessment ${nextAssessment.id}.`,
      );
      // Update application and student assessment.
      await this.dataSource.transaction(async (entityManager) => {
        summary.info(
          `Associating application currentProcessingAssessment as assessment id ${nextAssessment.id}.`,
        );
        const applicationUpdateResult = await entityManager
          .getRepository(Application)
          .update(application.id, {
            currentProcessingAssessment: { id: nextAssessment.id },
          });
        if (!applicationUpdateResult.affected) {
          throw new Error("Application update did not affected any records.");
        }
        summary.info(
          `Updating assessment status to ${StudentAssessmentStatus.Queued}.`,
        );
        const assessmentUpdateResults = await entityManager
          .getRepository(StudentAssessment)
          .update(nextAssessment.id, {
            studentAssessmentStatus: StudentAssessmentStatus.Queued,
          });
        if (!assessmentUpdateResults.affected) {
          throw new Error(
            "Student assessment update did not affected any records.",
          );
        }
      });
      summary.info(
        `Adding assessment to queue ${QueueNames.StartApplicationAssessment}.`,
      );
      await this.startAssessmentQueue.add({ assessmentId: nextAssessment.id });
      summary.info("Assessment queued for start.");
    } catch (error: unknown) {
      summary.error(
        `Error while enqueueing assessment workflow to be processed for application id ${application.id}.`,
        error,
      );
    }
    return summary;
  }

  /**
   * Queue the next pending assessment for cancellation for an application.
   * @param application application with pending assessments.
   * @returns process summary.
   */
  private async queueAssessmentCancellation(
    application: Application,
  ): Promise<ProcessSummary> {
    const summary = new ProcessSummary();
    try {
      summary.info(
        `Queueing next pending assessment for application id ${application.id}.`,
      );
      const [nextAssessment] = application.studentAssessments;
      summary.info(
        `Found ${application.studentAssessments.length} pending assessment(s) cancellation. Queueing assessment ${nextAssessment.id} for cancellation.`,
      );

      summary.info(
        `Updating assessment status to ${StudentAssessmentStatus.CancellationQueued}.`,
      );
      const now = new Date();
      const systemUser = await this.systemUsersService.systemUser();
      const assessmentUpdateResults = await this.dataSource
        .getRepository(StudentAssessment)
        .update(nextAssessment.id, {
          studentAssessmentStatus: StudentAssessmentStatus.CancellationQueued,
          studentAssessmentStatusUpdatedOn: now,
          modifier: systemUser,
          updatedAt: now,
        });
      if (!assessmentUpdateResults.affected) {
        throw new Error(
          "Student assessment update did not affected any records.",
        );
      }

      summary.info(
        `Adding assessment to queue ${QueueNames.CancelApplicationAssessment}.`,
      );
      await this.cancelAssessmentQueue.add({
        assessmentId: nextAssessment.id,
      });
      summary.info("Assessment queued for cancellation.");
    } catch (error: unknown) {
      summary.error(
        `Error while enqueueing assessment workflow to be canceled for application id ${application.id}.`,
        error,
      );
    }
    return summary;
  }
}
