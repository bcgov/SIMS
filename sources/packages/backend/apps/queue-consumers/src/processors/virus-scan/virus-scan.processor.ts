import { Process, Processor } from "@nestjs/bull";
import { QueueNames } from "@sims/utilities";
import { StudentFileService } from "apps/queue-consumers/src/services";
import { Job } from "bull";
import { VirusScanQueueInDTO } from "@sims/services/queue/dto/virus-scan.dto";
import { ProcessSummary } from "@sims/utilities/logger";

@Processor(QueueNames.VirusScan)
export class VirusScan {
  constructor(private readonly studentFileService: StudentFileService) {}

  /**
   * Perform virus scanning for all the files having pending scan status.
   */
  @Process()
  async performVirusScanj(job: Job<VirusScanQueueInDTO>) {
    const processSummary = new ProcessSummary();
    processSummary.info("Starting virus scan.");
    await this.studentFileService.scanFile(job.data.uniqueFileName);
    processSummary.info("Completed virus scanning for all the pending files.");
  }
}
