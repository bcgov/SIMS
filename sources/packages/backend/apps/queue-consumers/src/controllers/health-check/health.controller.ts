import { Controller, Get } from "@nestjs/common";
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
    private healthCheckService: HealthCheckService,
    private typeOrmHealthIndicator: TypeOrmHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
    private dataSource: DataSource,
  ) {}

  /**
   * Check the health of the Queues.
   * @returns the status of the health for Queues, with info or error and details.
   */
  @Get()
  @HealthCheck()
  async check() {
    return this.healthCheckService.check([
      () =>
        this.typeOrmHealthIndicator.pingCheck("Postgres", {
          connection: this.dataSource,
        }),
      () =>
        this.microservice.pingCheck<RedisOptions>("redis", {
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
