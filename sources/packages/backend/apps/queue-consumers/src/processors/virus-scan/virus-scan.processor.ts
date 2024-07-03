import { Process, Processor } from "@nestjs/bull";
import { QueueNames } from "@sims/utilities";
import { StudentFileService } from "apps/queue-consumers/src/services";
import { QueueProcessSummary } from "../models/processors.models";

@Processor(QueueNames.VirusScan)
export class VirusScan {
  constructor(private readonly studentFileService: StudentFileService) {}

  /**
   * Perform virus scanning for all the files having pending scan status.
   */
  @Process()
  async performVirusScan() {
    const summary = new QueueProcessSummary();
    await summary.info("Starting virus scan.");
    await this.studentFileService.scanFiles();
    await summary.info("Completed virus scanning for all the pending files.");
  }
}
