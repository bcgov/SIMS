import { Global, LoggerService, Module, OnModuleInit } from "@nestjs/common";
import { InjectLogger } from "@sims/utilities/logger";
import { MetricsService } from "apps/queue-consumers/src/services";

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

  @InjectLogger()
  logger: LoggerService;
}
