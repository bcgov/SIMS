import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { Queues, StartAssessmentQueueInDTO } from "@sims/queue";
import { WorkflowClientService } from "@sims/services";

@Processor(Queues.StartApplicationAssessment.name)
export class StartApplicationAssessmentProcessor {
  constructor(private readonly workflowClientService: WorkflowClientService) {}
  @Process()
  async startAssessment(job: Job<StartAssessmentQueueInDTO>) {
    await this.workflowClientService.startApplicationAssessment(
      job.data.workflowName,
      job.data.assessmentId,
    );
  }
}
