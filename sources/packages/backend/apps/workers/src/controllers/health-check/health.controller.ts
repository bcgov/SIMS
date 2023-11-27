import { Controller, Get } from "@nestjs/common";
import {
  HealthCheckService,
  HealthCheck,
  HealthCheckResult,
} from "@nestjs/terminus";
import { HealthService } from "../../../../../libs/services/src/health-check/health.service";

@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private healthIndicator: HealthService,
  ) {}

  /**
   * Check the health of the workers.
   * @returns the status of the health for workers, with info or error and details.
   */
  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([() => this.healthIndicator.isHealthy("workers")]);
  }
}
