import { Controller, Get } from "@nestjs/common";
import { RedisOptions, Transport } from "@nestjs/microservices";
import {
  HealthCheckService,
  HealthCheck,
  MicroserviceHealthIndicator,
} from "@nestjs/terminus";
import { HealthService } from "../../../../../libs/services/src/health-check/health.service";

@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private healthIndicator: HealthService,
    private microservice: MicroserviceHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.healthIndicator.isHealthy("ping"),
      () =>
        this.microservice.pingCheck<RedisOptions>("redis", {
          transport: Transport.REDIS,
          options: {
            host: "localhost",
            port: 6379,
            password: "admin",
          },
        }),
    ]);
  }
}
