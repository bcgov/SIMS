import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { RequestPDStatusQueueInDTO } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import { RequestPDStatusResponseQueueOutDTO } from "./models/atbc.dto";
import { ATBCIntegrationProcessingService } from "@sims/integrations/atbc-integration";

/**
 * Process PD request by student calling the ATBC
 * endpoint.
 */
@Processor(QueueNames.ATBCIntegration)
export class ATBCIntegrationProcessor {
  constructor(
    private readonly atbcIntegrationProcessingService: ATBCIntegrationProcessingService,
  ) {}

  /**
   * Call ATBC endpoint to apply PD status for a student.
   * @param job ATBC integration job.
   * @returns PD status processing response.
   */
  @Process()
  async applyForPDStatus(
    job: Job<RequestPDStatusQueueInDTO>,
  ): Promise<RequestPDStatusResponseQueueOutDTO> {
    await job.log(`Requesting PD status for student id ${job.data.studentId}`);
    const response =
      await this.atbcIntegrationProcessingService.applyForPDStatus(
        job.data.studentId,
      );
    await job.log(
      `Completed requesting PD status for student with response code ${response.code}`,
    );
    return {
      code: response.code,
      message: response.message,
    };
  }
}
