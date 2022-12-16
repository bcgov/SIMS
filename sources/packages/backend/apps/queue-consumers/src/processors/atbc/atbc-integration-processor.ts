import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { RequestPDStatusQueueInDTO } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { RequestPDStatusResponseQueueOutDTO } from "./models/atbc.dto";

/**
 * Process PD request by student calling the ATBC
 * endpoint.
 */
@Processor(QueueNames.ATBCIntegration)
export class ATBCIntegrationProcessor {
  @Process()
  async requestPDStatus(
    job: Job<RequestPDStatusQueueInDTO>,
  ): Promise<RequestPDStatusResponseQueueOutDTO> {
    job.log("job starts");
    return {
      code: 0,
      message: "test",
    };
  }
}
