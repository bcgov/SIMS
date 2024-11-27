import { getQueueToken } from "@nestjs/bull";
import { Injectable, LoggerService } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { QueueModel, QueueService } from "@sims/services/queue";
import { processInParallel } from "@sims/utilities";
import { InjectLogger } from "@sims/utilities/logger";
import { Queue } from "bull";
import { Gauge } from "prom-client";

type MonitoredQueue = { provider: Queue; queueModel: QueueModel };

@Injectable()
export class MetricsService {
  private readonly monitoredQueueProviders: MonitoredQueue[] = [];
  private readonly jobsCountsGauge = new Gauge({
    name: "queue_job_counts_current_total",
    help: "Current total number of job counts for 'active', 'completed', 'failed', 'delayed', 'waiting'.",
    labelNames: ["queueName", "queueEvent", "queueType"] as const,
  });

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly queueService: QueueService,
  ) {}

  async refreshJobCountsMetrics(): Promise<void> {
    // Refresh queues metrics settings.
    if (this.monitoredQueueProviders.length === 0) {
      const queues = await this.queueService.queueConfigurationModel();
      queues
        .filter((queueModel) => queueModel.isActive)
        .map((queueModel) => {
          const provider = this.moduleRef.get<Queue>(
            getQueueToken(queueModel.name),
            {
              strict: false,
            },
          );
          this.monitoredQueueProviders.push({ provider, queueModel });
        });
    }
    await processInParallel(
      (queue: MonitoredQueue) => this.refreshQueueMetrics(queue),
      this.monitoredQueueProviders,
    );
  }

  private async refreshQueueMetrics(queue: MonitoredQueue): Promise<void> {
    const queueProvider = this.moduleRef.get<Queue>(
      getQueueToken(queue.provider.name),
      {
        strict: false,
      },
    );
    const queueName = queue.provider.name;
    const queueType = queue.queueModel.isScheduler ? "scheduler" : "consumer";
    const queueJobCounts = await queueProvider.getJobCounts();
    Object.keys(queueJobCounts).forEach((jobCountEvent: string) => {
      this.jobsCountsGauge.set(
        {
          queueName,
          queueEvent: jobCountEvent,
          queueType,
        },
        queueJobCounts[jobCountEvent],
      );
    });
  }

  @InjectLogger()
  logger: LoggerService;
}
