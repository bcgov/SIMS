import { Injectable } from "@nestjs/common";
import { RedisOptions, Transport } from "@nestjs/microservices";
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
  MicroserviceHealthIndicator,
} from "@nestjs/terminus";
import { ConfigService } from "@sims/utilities/config";
import { ZeebeHealthIndicator } from "apps/workers/src/zeebe";

@Injectable()
export class HealthService extends HealthIndicator {
  constructor(
    private microservice: MicroserviceHealthIndicator,
    private readonly configService: ConfigService,
    private readonly zeebe: ZeebeHealthIndicator,
  ) {
    super();
  }

  /**
   * Check the health of the application.
   * @param key specifies if the health check is done for workers/queues.
   * @returns status of the health check.
   * In case of queues, we check if the redis is up and running.
   * In case of workers, we check if the zeebe is ready to accept the connections.
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    let isHealthy;
    let healthCheckResult;

    if (key === "queues") {
      const healthCheckResult = await this.checkRedisHealth();
      isHealthy = healthCheckResult.redis.status === "up";
    } else if (key === "workers") {
      const healthCheckResult = await this.checkZeebeHealth();
      isHealthy = healthCheckResult;
    }

    const result: HealthIndicatorResult = this.getStatus(key, isHealthy, {
      healthCheckResult,
    });

    if (isHealthy) {
      return result;
    }

    throw new HealthCheckError(`${key} check failed`, result);
  }

  /**
   * Check the redis connection is up and running.
   * @returns status of the redis connection.
   */
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

  /**
   * Check zeebe is ready to accept connection.
   * @returns status of the zeebe connection.
   */
  private async checkZeebeHealth(): Promise<boolean> {
    return this.zeebe.allConnected();
  }
}
