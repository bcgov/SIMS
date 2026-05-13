import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
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
    private readonly healthCheckService: HealthCheckService,
    private readonly zeebeHealthIndicator: ZeebeHealthIndicator,
    private readonly typeOrmHealthIndicator: TypeOrmHealthIndicator,
    private dataSource: DataSource,
  ) {}

  /**
   * Check the health of the workers.
   * @param timeout amount of milliseconds for the health checks.
   * @returns the status of the health for workers, with info or error and details.
   */
  @Get("timeout/:timeout")
  @HealthCheck()
  async check(@Param("timeout", ParseIntPipe) timeout: number) {
    return this.healthCheckService.check([
      () =>
        this.typeOrmHealthIndicator.pingCheck("sims-db", {
          connection: this.dataSource,
          timeout,
        }),
      () => this.zeebeHealthIndicator.check("zeebe"),
    ]);
  }
}
