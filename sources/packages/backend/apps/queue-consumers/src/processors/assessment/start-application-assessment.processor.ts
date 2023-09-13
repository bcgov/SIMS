import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { StartAssessmentQueueInDTO } from "@sims/services/queue";
import { WorkflowClientService } from "@sims/services";
import { QueueNames } from "@sims/utilities";
import { StudentAssessmentService } from "../../services";

/**
 * Process messages sent to start assessment queue.
 */
@Processor(QueueNames.StartApplicationAssessment)
export class StartApplicationAssessmentProcessor {
  constructor(
    private readonly workflowClientService: WorkflowClientService,
    private readonly studentAssessmentService: StudentAssessmentService,
  ) {}

  @Process()
  async startAssessment(job: Job<StartAssessmentQueueInDTO>) {
    let workflowName = job.data.workflowName;
    if (!workflowName) {
      const applicationData =
        await this.studentAssessmentService.getApplicationDynamicData(
          job.data.assessmentId,
        );
      workflowName = applicationData.workflowName;
    }
    await this.workflowClientService.startApplicationAssessment(
      workflowName,
      job.data.assessmentId,
    );
    // Todo: add queue history cleaning logic as in schedulers.
  }
}
