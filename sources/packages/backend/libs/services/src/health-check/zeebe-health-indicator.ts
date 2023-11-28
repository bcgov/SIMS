import { Injectable } from "@nestjs/common";
import { Workers } from "@sims/services/constants";

@Injectable()
export class ZeebeHealthIndicator {
  private readonly workersConnectionStatus: Record<string, boolean> = {};

  reportConnectionWorkerStatus(workerName: string, status: boolean) {
    this.workersConnectionStatus[workerName] = status;
  }

  allConnected(): boolean {
    const statuses = Object.values(this.workersConnectionStatus);
    if (statuses.length !== Object.keys(Workers).length) {
      // Check if the amount of reported statuses matches
      // with the amount of expected workers.
      return false;
    }
    // Check if all status are reported as successful.
    return Object.values(this.workersConnectionStatus).every(
      (status) => status === true,
    );
  }
}
