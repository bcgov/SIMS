import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from "@nestjs/terminus";
import { ZeebeHealthIndicator } from "../../zeebe";
import { DataSource } from "typeorm";

/**
 * HTTP Controller for handling health-related endpoint used for
 * liveliness and readiness probes.
 */
@Controller("health")
export class HealthController {
  constructor(
    private healthCheckService: HealthCheckService,
    private readonly zeebeHealthIndicator: ZeebeHealthIndicator,
    private typeOrmHealthIndicator: TypeOrmHealthIndicator,
    private dataSource: DataSource,
  ) {}

  /**
   * Check the health of the workers.
   * @returns the status of the health for workers, with info or error and details.
   */
  @Get()
  @HealthCheck()
  async check() {
    return this.healthCheckService.check([
      () =>
        this.typeOrmHealthIndicator.pingCheck("sims-db", {
          connection: this.dataSource,
        }),
      () => this.zeebeHealthIndicator.check("zeebe"),
    ]);
  }
}
