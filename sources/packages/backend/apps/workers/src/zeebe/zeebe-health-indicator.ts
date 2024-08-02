import { Injectable } from "@nestjs/common";
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from "@nestjs/terminus";
import { Workers } from "@sims/services/constants";

/**
 * List of all workers names to be monitored.
 */
const EXPECTED_WORKERS = Object.values(Workers);

@Injectable()
export class ZeebeHealthIndicator extends HealthIndicator {
  private readonly workersConnectionStatus: Record<string, boolean> = {};

  /**
   * Reports the connection status of a worker.
   * @param workerName worker whose connection status is being reported.
   * @param status connection status of the worker (true if connected, false otherwise).
   */
  reportConnectionWorkerStatus(workerName: string, status: boolean) {
    this.workersConnectionStatus[workerName] = status;
  }

  /**
   * Performs a health check for the Zeebe connection.
   * @param key identifier for the health check.
   * @throws HealthCheckError if the Zeebe connection check fails.
   * @returns The result of the Zeebe health check.
   */
  async check(key: string): Promise<HealthIndicatorResult> {
    const nonReportedWorkers: string[] = [];
    const notReadyWorkers: string[] = [];
    EXPECTED_WORKERS.forEach((workerName) => {
      const workerStatus = this.workersConnectionStatus[workerName];
      // Check if the worker reported its status.
      if (workerStatus === undefined) {
        nonReportedWorkers.push(workerName);
        return;
      }
      // Check if the worker status is connected.
      if (workerStatus === false) {
        notReadyWorkers.push(workerName);
      }
    });
    if (nonReportedWorkers.length) {
      throw new HealthCheckError(
        `${key} check failed`,
        this.getStatus(key, false, {
          message: `Some workers did not report their status: ${nonReportedWorkers.join(
            ", ",
          )}`,
        }),
      );
    }
    if (notReadyWorkers.length) {
      throw new HealthCheckError(
        `${key} check failed`,
        this.getStatus(key, false, {
          message: `Some workers are not ready: ${notReadyWorkers.join(", ")}`,
        }),
      );
    }
    // Return a successful health status if Zeebe connection is up.
    return super.getStatus(key, true, {
      message: "Zeebe workers connections states are ready.",
    });
  }
}
