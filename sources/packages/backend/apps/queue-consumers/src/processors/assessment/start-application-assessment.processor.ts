import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { StartAssessmentQueueInDTO } from "@sims/services/queue";
import { WorkflowClientService } from "@sims/services";
import { QueueNames } from "@sims/utilities";

/**
 * Process messages sent to start assessment queue.
 */
@Processor(QueueNames.StartApplicationAssessment)
export class StartApplicationAssessmentProcessor {
  constructor(private readonly workflowClientService: WorkflowClientService) {}

  @Process()
  async startAssessment(job: Job<StartAssessmentQueueInDTO>) {
    await this.workflowClientService.startApplicationAssessment(
      job.data.workflowName,
      job.data.assessmentId,
    );
    // Todo: add queue history cleaning logic as in schedulers.
  }
}
