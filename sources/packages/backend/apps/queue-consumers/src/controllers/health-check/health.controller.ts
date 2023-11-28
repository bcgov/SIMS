import { Controller, Get } from "@nestjs/common";
import { HealthCheckService, HealthCheck } from "@nestjs/terminus";
import { HealthService } from "@sims/services";

@Controller("health")
export class HealthController {
  constructor(
    private healthCheckService: HealthCheckService,
    private healthIndicator: HealthService,
  ) {}

  /**
   * Check the health of the Queues.
   * @returns the status of the health for Queues, with info or error and details.
   */
  @Get()
  @HealthCheck()
  check() {
    return this.healthCheckService.check([
      () => this.healthIndicator.isHealthy("queues"),
    ]);
  }
}
