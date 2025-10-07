import {
  Controller,
  Get,
  Header,
  InternalServerErrorException,
} from "@nestjs/common";
import { register } from "prom-client";
import { LoggerService } from "@sims/utilities/logger";

/**
 * Allows prometheus to scrape metrics from the queue-consumers.
 * @see https://developer.gov.bc.ca/docs/default/component/platform-developer-docs/docs/app-monitoring/user-defined-monitoring/#expose-the-metrics-from-your-app
 */
@Controller("metrics")
export class MetricsController {
  constructor(private readonly logger: LoggerService) {}

  /**
   * Exports metrics from the queue-consumers.
   * @returns metrics in Prometheus format.
   */
  @Get()
  @Header("content-type", register.contentType)
  async getMetrics(): Promise<string> {
    try {
      return register.metrics();
    } catch (error) {
      this.logger.error("Error while getting metrics.", error);
      throw new InternalServerErrorException(
        "Error while getting metrics. See server logs for details.",
      );
    }
  }
}
