import { Injectable } from "@nestjs/common";
import { HealthCheckError, HealthIndicator } from "@nestjs/terminus";
import { Workers } from "@sims/services/constants";

@Injectable()
export class ZeebeHealthIndicator extends HealthIndicator {
  constructor() {
    super();
    console.log("test");
  }
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

  /**
   * Performs a health check for the Zeebe connection.
   * @param key identifier for the health check.
   * @throws HealthCheckError if the Zeebe connection check fails.
   * @returns The result of the Zeebe health check.
   */
  public check(key: string) {
    // Check if the Zeebe connection is healthy.
    const isHealthy = this.allConnected();
    if (isHealthy) {
      // Return a successful health status if Zeebe connection is up.
      return super.getStatus(key, isHealthy, {
        message: "Zeebe connection is up and running.",
      });
    }
    // Throw an error if Zeebe connection check fails.
    throw new HealthCheckError(
      `${key} check failed`,
      this.getStatus(key, isHealthy, {
        message: "Cannot connect to zeebe.",
      }),
    );
  }
}
