import { Global, Inject, Module, OnModuleInit } from "@nestjs/common";
import { MetricsService } from "./services";
import { LoggerService } from "@sims/utilities/logger";

@Global()
@Module({
  providers: [MetricsService],
  exports: [MetricsService],
})
export class QueuesMetricsModule implements OnModuleInit {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Method that is invoked on application initialization and
   * is responsible for setting up the metrics for all queues.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log("Associating queue events for metrics.");
    this.metricsService.setGlobalMetricsConfigurations();
    await this.metricsService.associateQueueEventsCountersMetrics();
  }

  @Inject(LoggerService)
  logger: LoggerService;
}
