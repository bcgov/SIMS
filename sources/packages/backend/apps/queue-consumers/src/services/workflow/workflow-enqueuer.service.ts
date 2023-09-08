import { Injectable } from "@nestjs/common";
import { ApplicationService } from "..";
import { Queue } from "bull";
import { StartAssessmentQueueInDTO } from "@sims/services/queue";
import { InjectQueue } from "@nestjs/bull";
import { QueueNames, parseJSONError, processInParallel } from "@sims/utilities";
import { Application, StudentAssessmentStatus } from "@sims/sims-db";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { ProcessSummaryResult } from "@sims/integrations/models";

/**
 * Manages the operations to search assessments that requires some
 * workflow operations, for instance, triggering their start or cancellation.
 */
@Injectable()
export class WorkflowEnqueuerService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    private readonly applicationService: ApplicationService,
    @InjectQueue(QueueNames.StartApplicationAssessment)
    private readonly startAssessmentQueue: Queue<StartAssessmentQueueInDTO>,
  ) {}

  /**
   * Search applications with pending assessments to be processed by the assessment workflow.
   * If no other assessment is being processed for that application the oldest pending
   * assessment will be queue for start.
   * @returns
   */
  async enqueueStartAssessmentWorkflows(): Promise<ProcessSummaryResult> {
    const result = new ProcessSummaryResult();
    try {
      result.summary.push(
        "Checking database for applications with assessments waiting to be triggered.",
      );
      const applications =
        await this.applicationService.getApplicationsToStartAssessments();
      result.summary.push(`Found ${applications.length} applications.`);
      if (!applications.length) {
        result.summary.push("No applications found");
        return result;
      }
      result.children = await processInParallel(
        (application: Application) => this.queueNextAssessment(application),
        applications,
      );
    } catch (error: unknown) {
      result.errors.push(
        `Error while enqueueing assessment workflows to be processed. ${parseJSONError(
          error,
        )}`,
      );
    }
    return result;
  }

  /**
   * Queue the next pending assessment for an application.
   * @param application application with pending assessments.
   * @returns process summary.
   */
  private async queueNextAssessment(
    application: Application,
  ): Promise<ProcessSummaryResult> {
    const result = new ProcessSummaryResult();
    try {
      result.summary.push(
        `Queueing next pending assessment for application id ${application.id}.`,
      );
      const [nextAssessment] = application.studentAssessments;
      result.summary.push(
        `Found ${application.studentAssessments.length} pending assessment(s). Queueing assessment ${nextAssessment.id}.`,
      );
      nextAssessment.studentAssessmentStatus = StudentAssessmentStatus.Queued;
      application.currentProcessingAssessment = nextAssessment;
      result.summary.push(
        `Updating assessment status to ${StudentAssessmentStatus.Queued}.`,
      );
      await this.applicationRepo.save(application);
      result.summary.push(
        `Adding assessment to queue ${QueueNames.StartApplicationAssessment}.`,
      );
      await this.startAssessmentQueue.add({ assessmentId: nextAssessment.id });
      result.summary.push(`Assessment queued for start.`);
    } catch (error: unknown) {
      result.errors.push(
        `Error while enqueueing assessment workflow to be processed. ${parseJSONError(
          error,
        )}`,
      );
    }
    return result;
  }
}
