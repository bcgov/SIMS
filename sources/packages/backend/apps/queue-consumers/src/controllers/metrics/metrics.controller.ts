import { Controller, Get, Header } from "@nestjs/common";
import { register } from "prom-client";

@Controller("metrics")
export class MetricsController {
  @Get()
  @Header("content-type", register.contentType)
  async getMetrics(): Promise<string> {
    return register.metrics();
  }
}
