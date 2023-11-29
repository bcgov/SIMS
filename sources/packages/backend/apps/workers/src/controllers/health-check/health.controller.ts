import { Controller, Get } from "@nestjs/common";
import {
  HealthCheckService,
  HealthCheck,
  HealthCheckResult,
} from "@nestjs/terminus";
import { HealthService } from "@sims/services";

/**
 * HTTP Controller for handling health-related endpoint used for
 * liveliness and readiness probes.
 */
@Controller("health")
export class HealthController {
  constructor(
    private healthCheckService: HealthCheckService,
    private healthIndicator: HealthService,
  ) {}

  /**
   * Check the health of the workers.
   * @returns the status of the health for workers, with info or error and details.
   */
  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([
      () => this.healthIndicator.isHealthy("workers"),
    ]);
  }
}
