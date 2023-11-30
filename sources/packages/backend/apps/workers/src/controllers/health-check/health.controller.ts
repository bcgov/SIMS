import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckError,
  HealthIndicatorResult,
} from "@nestjs/terminus";
import { ZeebeHealthIndicator } from "../../zeebe";

/**
 * HTTP Controller for handling health-related endpoint used for
 * liveliness and readiness probes.
 */
@Controller("health")
export class HealthController {
  constructor(private readonly zeebeHealthIndicator: ZeebeHealthIndicator) {}

  /**
   * Check the health of the workers.
   * @returns the status of the health for workers, with info or error and details.
   */
  @Get()
  @HealthCheck()
  async check(): Promise<HealthIndicatorResult> {
    const healthCheckResult = await this.zeebeHealthIndicator.check("zeebe");
    const isHealthy = healthCheckResult.zeebe.status === "up";
    if (isHealthy) {
      return healthCheckResult;
    }

    throw new HealthCheckError("Queues check failed", healthCheckResult);
  }
}
