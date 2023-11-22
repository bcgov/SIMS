import { Injectable } from "@nestjs/common";
import { RedisOptions, Transport } from "@nestjs/microservices";
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
  MicroserviceHealthIndicator,
} from "@nestjs/terminus";
import { ConfigService } from "@sims/utilities/config";
import axios from "axios";

@Injectable()
export class HealthService extends HealthIndicator {
  constructor(
    private microservice: MicroserviceHealthIndicator,
    private readonly configService: ConfigService,
  ) {
    super();
  }
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    let isHealthy;
    let healthCheckResult;

    if (key === "queues") {
      const healthCheckResult = await this.checkRedisHealth();
      isHealthy = healthCheckResult.redis.status === "up" ? true : false;
    } else if (key === "workers") {
      const healthCheckResult = await this.checkZeebeHealth();
      isHealthy = healthCheckResult.status === 204 ? true : false;
    }

    const result: HealthIndicatorResult = this.getStatus(key, isHealthy, {
      healthCheckResult,
    });

    if (isHealthy) {
      return result;
    }

    throw new HealthCheckError(`${key} check failed`, result);
  }

  private async checkRedisHealth(): Promise<HealthIndicatorResult> {
    return this.microservice.pingCheck<RedisOptions>("redis", {
      transport: Transport.REDIS,
      options: {
        host: this.configService.redis.redisHost,
        port: this.configService.redis.redisPort,
        password: this.configService.redis.redisPassword,
      },
    });
  }

  private async checkZeebeHealth(): Promise<any> {
    const response = await axios.get("/health");
    return response;
  }
}
