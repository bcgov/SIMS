import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { QueueNames, StartAssessmentQueueInDTO } from "@sims/services/queue";
import { WorkflowClientService } from "@sims/services";

/**
 * Process messages sent to send email notification.
 */
@Processor(QueueNames.SendEmailNotification)
export class SendEmailNotificationProcessor {
  constructor(private readonly workflowClientService: WorkflowClientService) {}

  @Process()
  async startAssessment(job: Job<StartAssessmentQueueInDTO>) {
    console.log(job.data);
  }
}
