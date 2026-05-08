import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { DataSource } from "typeorm";
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from "@nestjs/terminus";
import { AllowDuringMaintenanceMode, Public } from "../../auth/decorators";
import { SkipThrottle } from "@nestjs/throttler";

@SkipThrottle()
@AllowDuringMaintenanceMode()
@Controller("health")
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly dataSource: DataSource,
    private readonly typeOrmHealthIndicator: TypeOrmHealthIndicator,
  ) {}

  /**
   * Check the health of the api.
   * @param timeout amount of milliseconds for the health checks.
   * @returns the status of the health for api, with info or error and details.
   */
  @Get("timeout/:timeout")
  @HealthCheck()
  @Public()
  async check(@Param("timeout", ParseIntPipe) timeout: number) {
    return this.healthCheckService.check([
      () =>
        this.typeOrmHealthIndicator.pingCheck("sims-db", {
          connection: this.dataSource,
          timeout,
        }),
    ]);
  }
}
