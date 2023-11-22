import { Controller, Get } from "@nestjs/common";
import { HealthCheckService, HealthCheck } from "@nestjs/terminus";
import { HealthService } from "../../../../../libs/services/src/health-check/health.service";

@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private healthIndicator: HealthService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.healthIndicator.isHealthy("queues")]);
  }
}
