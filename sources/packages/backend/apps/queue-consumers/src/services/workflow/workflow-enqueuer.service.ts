import { Injectable } from "@nestjs/common";
import { ApplicationService } from "..";
import { Queue } from "bull";
import { StartAssessmentQueueInDTO } from "@sims/services/queue";
import { InjectQueue } from "@nestjs/bull";
import { QueueNames, processInParallel } from "@sims/utilities";
import {
  Application,
  StudentAssessment,
  StudentAssessmentStatus,
} from "@sims/sims-db";
import { DataSource } from "typeorm";
import { LogScopes, ProcessSummary } from "@sims/utilities/logger";

/**
 * Manages the operations to search assessments that requires some
 * workflow operations, for instance, triggering their start or cancellation.
 */
@Injectable()
export class WorkflowEnqueuerService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly applicationService: ApplicationService,
    @InjectQueue(QueueNames.StartApplicationAssessment)
    private readonly startAssessmentQueue: Queue<StartAssessmentQueueInDTO>,
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
        LogScopes.Summary,
      );
      const applications =
        await this.applicationService.getApplicationsToStartAssessments();
      summary.info(
        `Found ${applications.length} applications.`,
        LogScopes.Summary,
      );
      if (!applications.length) {
        return;
      }
      summary.children = await processInParallel(
        (application: Application) => this.queueNextAssessment(application),
        applications,
      );
      summary.info("All assessments were processed.", LogScopes.Summary);
    } catch (error: unknown) {
      summary.error(
        "Error while enqueueing assessment workflows to be processed.",
        error,
        LogScopes.Summary,
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
}
