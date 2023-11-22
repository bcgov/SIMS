import { Injectable } from "@nestjs/common";
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from "@nestjs/terminus";

export interface Ping {
  tries: number;
  status: string;
}

@Injectable()
export class HealthService extends HealthIndicator {
  private pings: Ping[] = [
    { tries: 1, status: "up" },
    { tries: 2, status: "up" },
  ];

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const healthy = this.pings.filter((ping) => ping.status === "up");
    const isHealthy = healthy.length > 0;
    const result = this.getStatus(key, isHealthy, { ping: healthy.length });

    if (isHealthy) {
      return result;
    }
    throw new HealthCheckError(key + " check failed", result);
  }
}
