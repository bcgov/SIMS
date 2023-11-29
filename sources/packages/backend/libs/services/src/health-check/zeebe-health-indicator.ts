import { Injectable } from "@nestjs/common";
import { Workers } from "@sims/services/constants";

@Injectable()
export class ZeebeHealthIndicator {
  private readonly workersConnectionStatus: Record<string, boolean> = {};

  /**
   * Reports the connection status of a worker.
   * @param workerName worker whose connection status is being reported.
   * @param status - The connection status of the worker (true if connected, false otherwise).
   */
  reportConnectionWorkerStatus(workerName: string, status: boolean) {
    this.workersConnectionStatus[workerName] = status;
  }

  /**
   * Checks if all workers are connected.
   * @returns True if all workers are connected, false otherwise.
   */
  allConnected(): boolean {
    const statuses = Object.values(this.workersConnectionStatus);
    const totalWorkersCount = Object.keys(Workers).length;
    if (statuses.length !== totalWorkersCount) {
      // Check if the amount of reported statuses matches
      // with the amount of expected workers.
      return false;
    }
    // Check if all status are reported as successful.
    return statuses.every((status) => status === true);
  }
}
