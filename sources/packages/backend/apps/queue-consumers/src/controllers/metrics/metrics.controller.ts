import { Controller, Get, Header } from "@nestjs/common";
import { MetricsService } from "../../services";
import { register } from "prom-client";

@Controller("metrics")
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header("content-type", register.contentType)
  async getMetrics(): Promise<string> {
    console.time("refreshJobCountsMetrics");
    await this.metricsService.refreshJobCountsMetrics();
    console.timeEnd("refreshJobCountsMetrics");
    return register.metrics();
  }
}
