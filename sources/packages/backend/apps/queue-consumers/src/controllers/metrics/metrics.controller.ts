import { Controller, Get, Header } from "@nestjs/common";
import { Registry, Counter } from "prom-client";

@Controller("metrics")
export class MetricsController {
  private readonly registry = new Registry();
  private readonly requestCounter = new Counter({
    name: "metrics_http_requests_total",
    help: "Total number of HTTP metrics requests",
    registers: [this.registry],
  });

  @Get()
  @Header("content-type", "text/plain")
  async getMetrics(): Promise<string> {
    console.log("metrics");
    this.requestCounter.inc(Math.floor(Math.random() * 10));
    return this.registry.metrics();
  }
}
