import { Controller, Get } from "@nestjs/common";
import { RedisOptions, Transport } from "@nestjs/microservices";
import {
  HealthCheck,
  MicroserviceHealthIndicator,
  HealthCheckError,
  HealthIndicatorResult,
} from "@nestjs/terminus";
import { ConfigService } from "@sims/utilities/config";

@Controller("health")
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    private microservice: MicroserviceHealthIndicator,
  ) {}

  /**
   * Check the health of the Queues.
   * @returns the status of the health for Queues, with info or error and details.
   */
  @Get()
  @HealthCheck()
  async check(): Promise<HealthIndicatorResult> {
    const healthCheckResult = await this.microservice.pingCheck<RedisOptions>(
      "redis",
      {
        transport: Transport.REDIS,
        options: {
          host: this.configService.redis.redisHost,
          port: this.configService.redis.redisPort,
          password: this.configService.redis.redisPassword,
        },
      },
    );
    const isHealthy = healthCheckResult.redis.status === "up";
    if (isHealthy) {
      return healthCheckResult;
    }

    throw new HealthCheckError("Queues check failed", healthCheckResult);
  }
}
