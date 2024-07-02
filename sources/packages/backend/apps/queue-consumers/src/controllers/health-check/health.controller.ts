import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { RedisOptions, Transport } from "@nestjs/microservices";
import {
  HealthCheck,
  MicroserviceHealthIndicator,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from "@nestjs/terminus";
import { ConfigService } from "@sims/utilities/config";
import { DataSource } from "typeorm";

@Controller("health")
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly healthCheckService: HealthCheckService,
    private readonly typeOrmHealthIndicator: TypeOrmHealthIndicator,
    private readonly microservice: MicroserviceHealthIndicator,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Check the health of the Queues.
   * @param timeout amount of milliseconds for the health checks.
   * @returns the status of the health for Queues, with info or error and details.
   */
  @Get("timeout/:timeout")
  @HealthCheck()
  async check(@Param("timeout", ParseIntPipe) timeout: number) {
    return this.healthCheckService.check([
      () =>
        this.typeOrmHealthIndicator.pingCheck("sims-db", {
          timeout,
          connection: this.dataSource,
        }),
      () =>
        this.microservice.pingCheck<RedisOptions>("redis", {
          timeout,
          transport: Transport.REDIS,
          options: {
            host: this.configService.redis.redisHost,
            port: this.configService.redis.redisPort,
            password: this.configService.redis.redisPassword,
          },
        }),
    ]);
  }
}
