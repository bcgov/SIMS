import { Controller, Get } from "@nestjs/common";
import { DataSource } from "typeorm";
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from "@nestjs/terminus";
import { Public } from "../../auth/decorators";

@Controller("health")
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private dataSource: DataSource,
    private readonly typeOrmHealthIndicator: TypeOrmHealthIndicator,
  ) {}

  /**
   * Check the health of the api.
   * @returns the status of the health for api, with info or error and details.
   */
  @Get()
  @HealthCheck()
  @Public()
  async check() {
    return this.healthCheckService.check([
      () =>
        this.typeOrmHealthIndicator.pingCheck("sims-db", {
          connection: this.dataSource,
        }),
    ]);
  }
}
