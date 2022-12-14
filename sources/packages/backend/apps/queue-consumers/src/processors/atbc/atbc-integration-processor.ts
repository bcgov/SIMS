import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { RequestPDStatusQueueInDTO } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";

/**
 * Process PD request by student calling the ATBC
 * endpoint.
 */
@Processor(QueueNames.ATBCIntegration)
export class ATBCIntegrationProcessor {
  @Process()
  async requestPDStatus(job: Job<RequestPDStatusQueueInDTO>) {
    console.log("process atbc integration", job.data);
  }
}
