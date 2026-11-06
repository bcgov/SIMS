import { Global, Module, OnModuleInit } from "@nestjs/common";
import { MetricsService } from "./services";
import { LoggerService } from "@sims/utilities/logger";

@Global()
@Module({
  providers: [MetricsService],
  exports: [MetricsService],
})
export class QueuesMetricsModule implements OnModuleInit {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Method that is invoked on application initialization and
   * is responsible for setting up the metrics for all queues.
   */
  onModuleInit(): void {
    this.logger.log("Configuring queue metrics.");
    this.metricsService.setGlobalMetricsConfigurations();
  }
}
